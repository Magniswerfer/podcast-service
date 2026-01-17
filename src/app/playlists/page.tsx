"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlaylistModal } from "@/components/PlaylistModal";
import { AlertModal } from "@/components/AlertModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

interface Playlist {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        items: number;
    };
}

export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
    const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const response = await fetch("/api/playlists");
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                throw new Error("Failed to fetch playlists");
            }
            const data = await response.json();
            setPlaylists(data.playlists || []);
        } catch (error) {
            console.error("Error fetching playlists:", error);
            setAlertMessage("Failed to load playlists");
        } finally {
            setLoading(false);
        }
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
            setPlaylists((prev) => [data.playlist, ...prev]);
            setShowCreateModal(false);
            setAlertMessage("Playlist created successfully!");
        } catch (error) {
            throw error;
        }
    };

    const handleUpdatePlaylist = async (name: string, description?: string) => {
        if (!editingPlaylist) return;

        try {
            const response = await fetch(`/api/playlists/${editingPlaylist.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update playlist");
            }

            const data = await response.json();
            setPlaylists((prev) =>
                prev.map((p) => (p.id === editingPlaylist.id ? data.playlist : p))
            );
            setEditingPlaylist(null);
            setAlertMessage("Playlist updated successfully!");
        } catch (error) {
            throw error;
        }
    };

    const handleDeletePlaylist = async () => {
        if (!deletingPlaylist) return;

        try {
            const response = await fetch(`/api/playlists/${deletingPlaylist.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete playlist");
            }

            setPlaylists((prev) => prev.filter((p) => p.id !== deletingPlaylist.id));
            setDeletingPlaylist(null);
            setAlertMessage("Playlist deleted successfully!");
        } catch (error) {
            console.error("Error deleting playlist:", error);
            setAlertMessage("Failed to delete playlist");
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-[#a0a0a0]">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">My Playlists</h1>
                <Button onClick={() => setShowCreateModal(true)}>
                    <PlusIcon className="h-5 w-5 mr-2 inline" />
                    Create Playlist
                </Button>
            </div>

            {playlists.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-[#a0a0a0] mb-4">No playlists yet</p>
                    <Button onClick={() => setShowCreateModal(true)}>
                        Create Your First Playlist
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playlists.map((playlist) => (
                        <Card key={playlist.id} interactive className="p-6">
                            <Link href={`/playlists/${playlist.id}`}>
                                <h3 className="font-semibold text-white mb-2 truncate">
                                    {playlist.name}
                                </h3>
                                {playlist.description && (
                                    <p className="text-sm text-[#a0a0a0] mb-3 line-clamp-2">
                                        {playlist.description}
                                    </p>
                                )}
                                <p className="text-xs text-[#a0a0a0] mb-4">
                                    {playlist._count?.items || 0} item
                                    {(playlist._count?.items || 0) !== 1 ? "s" : ""}
                                </p>
                            </Link>
                            <div className="flex space-x-2 mt-4">
                                <Button
                                    variant="icon"
                                    size="sm"
                                    onClick={() => setEditingPlaylist(playlist)}
                                    title="Edit playlist"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="icon"
                                    size="sm"
                                    onClick={() => setDeletingPlaylist(playlist)}
                                    title="Delete playlist"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <PlaylistModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleCreatePlaylist}
                />
            )}

            {editingPlaylist && (
                <PlaylistModal
                    onClose={() => setEditingPlaylist(null)}
                    onSave={handleUpdatePlaylist}
                    initialName={editingPlaylist.name}
                    initialDescription={editingPlaylist.description}
                    title="Edit Playlist"
                />
            )}

            {deletingPlaylist && (
                <ConfirmModal
                    message={`Are you sure you want to delete "${deletingPlaylist.name}"? This action cannot be undone.`}
                    onConfirm={handleDeletePlaylist}
                    onCancel={() => setDeletingPlaylist(null)}
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
