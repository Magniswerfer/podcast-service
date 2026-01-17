"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlaylistItem } from "@/components/PlaylistItem";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";
import { PlaylistModal } from "@/components/PlaylistModal";
import { AlertModal } from "@/components/AlertModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { usePlayer } from "@/contexts/PlayerContext";
import {
    PlusIcon,
    TrashIcon,
    PencilIcon,
    ArrowLeftIcon,
    PlayIcon,
} from "@heroicons/react/24/outline";

interface PlaylistItemData {
    id: string;
    position: number;
    podcast?: {
        id: string;
        title: string;
        artworkUrl?: string;
        author?: string;
    } | null;
    episode?: {
        id: string;
        title: string;
        artworkUrl?: string;
        podcast?: {
            id: string;
            title: string;
            artworkUrl?: string;
        };
    } | null;
}

interface Playlist {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    items: PlaylistItemData[];
}

export default function PlaylistDetailPage() {
    const params = useParams();
    const router = useRouter();
    const playlistId = params.id as string;
    const { playEpisode, clearQueue, addToQueue } = usePlayer();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [removingItemId, setRemovingItemId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    useEffect(() => {
        if (playlistId) {
            fetchPlaylist();
        }
    }, [playlistId]);

    const fetchPlaylist = async () => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}`);
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                if (response.status === 404) {
                    setAlertMessage("Playlist not found");
                    return;
                }
                throw new Error("Failed to fetch playlist");
            }
            const data = await response.json();
            setPlaylist(data.playlist);
        } catch (error) {
            console.error("Error fetching playlist:", error);
            setAlertMessage("Failed to load playlist");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToPlaylist = async (targetPlaylistId: string) => {
        // Note: This modal is typically used from podcast/episode pages
        // For adding items to this playlist, users should use the "Add to Playlist" button
        // on podcast or episode pages and select this playlist
        setShowAddModal(false);
    };

    const handleCreatePlaylist = async (name: string, description?: string) => {
        try {
            const response = await fetch("/api/playlists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create playlist");
            }

            const data = await response.json();
            return data.playlist;
        } catch (error) {
            throw error;
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        setRemovingItemId(itemId);
        try {
            const response = await fetch(
                `/api/playlists/${playlistId}/items/${itemId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to remove item");
            }

            // Refresh playlist
            await fetchPlaylist();
            setAlertMessage("Item removed from playlist");
        } catch (error) {
            console.error("Error removing item:", error);
            setAlertMessage("Failed to remove item");
        } finally {
            setRemovingItemId(null);
        }
    };

    const handleUpdatePlaylist = async (name: string, description?: string) => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update playlist");
            }

            const data = await response.json();
            setPlaylist((prev) => (prev ? { ...prev, ...data.playlist } : null));
            setShowEditModal(false);
            setAlertMessage("Playlist updated successfully!");
        } catch (error) {
            throw error;
        }
    };

    const handleDeletePlaylist = async () => {
        try {
            const response = await fetch(`/api/playlists/${playlistId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete playlist");
            }

            router.push("/playlists");
        } catch (error) {
            console.error("Error deleting playlist:", error);
            setAlertMessage("Failed to delete playlist");
        }
    };

    const handlePlayPlaylist = async () => {
        if (!playlist) return;

        // Find the first episode item in the playlist
        const firstEpisodeItem = playlist.items.find((item) => item.episode);
        if (!firstEpisodeItem?.episode) {
            setAlertMessage("No episodes found in playlist");
            return;
        }

        try {
            // Fetch full episode data (including audioUrl)
            const episodeResponse = await fetch(`/api/episodes/${firstEpisodeItem.episode.id}`);
            if (!episodeResponse.ok) {
                throw new Error("Failed to fetch episode data");
            }
            const episodeData = await episodeResponse.json();

            // Clear current queue
            await clearQueue();

            // Transform episode data to match Episode interface
            const episode = {
                id: episodeData.id,
                title: episodeData.title,
                audioUrl: episodeData.audioUrl,
                artworkUrl: episodeData.artworkUrl,
                podcast: {
                    id: episodeData.podcast.id,
                    title: episodeData.podcast.title,
                    artworkUrl: episodeData.podcast.artworkUrl,
                },
            };

            // Play first episode from beginning (startPosition = 0)
            await playEpisode(episode, 0);

            // Add all remaining episodes to queue
            const remainingItems = playlist.items.filter(
                (item) => item.episode && item.position > firstEpisodeItem.position
            );

            for (const item of remainingItems) {
                if (item.episode) {
                    try {
                        await addToQueue(item.episode.id);
                    } catch (error) {
                        // Continue adding other episodes even if one fails
                        console.error(`Failed to add episode ${item.episode.id} to queue:`, error);
                    }
                }
            }
        } catch (error) {
            console.error("Error playing playlist:", error);
            setAlertMessage("Failed to play playlist");
        }
    };

    const handlePlayEpisode = async (episodeId: string, position: number) => {
        if (!playlist) return;

        try {
            // Fetch full episode data
            const episodeResponse = await fetch(`/api/episodes/${episodeId}`);
            if (!episodeResponse.ok) {
                throw new Error("Failed to fetch episode data");
            }
            const episodeData = await episodeResponse.json();

            // Transform episode data to match Episode interface
            const episode = {
                id: episodeData.id,
                title: episodeData.title,
                audioUrl: episodeData.audioUrl,
                artworkUrl: episodeData.artworkUrl,
                podcast: {
                    id: episodeData.podcast.id,
                    title: episodeData.podcast.title,
                    artworkUrl: episodeData.podcast.artworkUrl,
                },
            };

            // Play the clicked episode (playEpisode already adds it to play-next position)
            await playEpisode(episode);

            // Find all episodes below the clicked position
            const remainingItems = playlist.items.filter(
                (item) => item.episode && item.position > position
            );

            // Add each remaining episode to queue
            for (const item of remainingItems) {
                if (item.episode) {
                    try {
                        await addToQueue(item.episode.id);
                    } catch (error) {
                        // Continue adding other episodes even if one fails
                        console.error(`Failed to add episode ${item.episode.id} to queue:`, error);
                    }
                }
            }
        } catch (error) {
            console.error("Error playing episode:", error);
            setAlertMessage("Failed to play episode");
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-[#a0a0a0]">Loading...</div>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <p className="text-[#a0a0a0]">Playlist not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/playlists"
                    className="inline-flex items-center text-[#a0a0a0] hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back to Playlists
                </Link>

                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {playlist.name}
                            </h1>
                            {playlist.description && (
                                <p className="text-[#e5e5e5] mb-4">
                                    {playlist.description}
                                </p>
                            )}
                            <p className="text-sm text-[#a0a0a0]">
                                {playlist.items.length} item
                                {playlist.items.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div className="flex space-x-2 shrink-0">
                            {playlist.items.some((item) => item.episode) && (
                                <Button
                                    variant="icon"
                                    onClick={handlePlayPlaylist}
                                    title="Play playlist from beginning"
                                >
                                    <PlayIcon className="h-5 w-5" />
                                </Button>
                            )}
                            <Button
                                variant="icon"
                                onClick={() => setShowEditModal(true)}
                                title="Edit playlist"
                            >
                                <PencilIcon className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="icon"
                                onClick={() => setShowDeleteConfirm(true)}
                                title="Delete playlist"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Items */}
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-white">Items</h2>
                <Button onClick={() => setShowAddModal(true)}>
                    <PlusIcon className="h-5 w-5 mr-2 inline" />
                    Add Item
                </Button>
            </div>

            {playlist.items.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-[#a0a0a0] mb-4">
                        This playlist is empty
                    </p>
                    <Button onClick={() => setShowAddModal(true)}>
                        Add Your First Item
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {playlist.items.map((item) => (
                        <PlaylistItem
                            key={item.id}
                            id={item.id}
                            podcast={item.podcast}
                            episode={item.episode}
                            position={item.position}
                            onRemove={handleRemoveItem}
                            onPlay={item.episode ? () => handlePlayEpisode(item.episode!.id, item.position) : undefined}
                            isRemoving={removingItemId === item.id}
                        />
                    ))}
                </div>
            )}

            {showAddModal && (
                <AddToPlaylistModal
                    onClose={() => setShowAddModal(false)}
                    onAddToPlaylist={async (targetPlaylistId: string) => {
                        // Note: This modal is for adding to OTHER playlists
                        // For adding to current playlist, we'd need a different flow
                        // For now, we'll just close it
                        setShowAddModal(false);
                    }}
                    onCreatePlaylist={handleCreatePlaylist}
                />
            )}

            {showEditModal && (
                <PlaylistModal
                    onClose={() => setShowEditModal(false)}
                    onSave={handleUpdatePlaylist}
                    initialName={playlist.name}
                    initialDescription={playlist.description}
                    title="Edit Playlist"
                />
            )}

            {showDeleteConfirm && (
                <ConfirmModal
                    message={`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`}
                    onConfirm={handleDeletePlaylist}
                    onCancel={() => setShowDeleteConfirm(false)}
                    title="Delete Playlist"
                    confirmText="Delete"
                    cancelText="Cancel"
                />
            )}

            {alertMessage && (
                <AlertModal
                    message={alertMessage}
                    onClose={() => setAlertMessage(null)}
                    title={alertMessage.includes("successfully") ? "Success" : "Error"}
                />
            )}
        </div>
    );
}
