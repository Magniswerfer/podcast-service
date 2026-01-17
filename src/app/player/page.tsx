"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PlusIcon, PlayIcon } from "@heroicons/react/24/outline";
import { usePlayer } from "@/contexts/PlayerContext";
import { Shownotes } from "@/components/player/Shownotes";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";
import { Button } from "@/components/ui/Button";
import { formatDate, useDateFormat } from "@/lib/date-format";

export default function PlayerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentEpisode, loadEpisode, playEpisode, isPlaying, currentTime } = usePlayer();
    const userDateFormat = useDateFormat();

    const [episodeDetails, setEpisodeDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    useEffect(() => {
        const episodeId = searchParams.get("id");
        
        // If we have an episode ID from URL, load that episode
        if (episodeId && (!currentEpisode || currentEpisode.id !== episodeId)) {
            const fetchAndLoadEpisode = async () => {
                try {
                    const response = await fetch(`/api/episodes/${episodeId}`);
                    if (response.ok) {
                        const data = await response.json();
                        const episode = {
                            id: data.id,
                            title: data.title,
                            audioUrl: data.audioUrl,
                            artworkUrl: data.artworkUrl,
                            podcast: {
                                id: data.podcast.id,
                                title: data.podcast.title,
                                artworkUrl: data.podcast.artworkUrl,
                            },
                        };
                        // Set episode details immediately from the fetched data
                        setEpisodeDetails(data);
                        setLoading(false);
                        // Load episode without playing
                        await loadEpisode(episode);
                    } else {
                        router.push("/");
                        return;
                    }
                } catch (error) {
                    console.error("Error fetching episode:", error);
                    router.push("/");
                    return;
                }
            };
            fetchAndLoadEpisode();
            return; // Exit early - we'll handle details after loading
        }

        // If no episode ID in URL and no current episode, redirect home
        if (!episodeId && !currentEpisode) {
            router.push("/");
            return;
        }

        // Fetch full episode details including description if we have currentEpisode
        if (currentEpisode) {
            // Only fetch if we don't already have details for this episode
            if (!episodeDetails || episodeDetails.id !== currentEpisode.id) {
                const fetchEpisodeDetails = async () => {
                    try {
                        const response = await fetch(
                            `/api/episodes/${currentEpisode.id}`,
                        );
                        if (response.ok) {
                            const data = await response.json();
                            setEpisodeDetails(data);
                        }
                    } catch (error) {
                        console.error("Error fetching episode details:", error);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchEpisodeDetails();
            } else {
                setLoading(false);
            }
        }
    }, [currentEpisode, router, searchParams, loadEpisode]);

    if (!currentEpisode) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center pb-40">
                <div className="text-[#a0a0a0]">Loading...</div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        const response = await fetch(`/api/playlists/${playlistId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ episodeId: currentEpisode.id }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to add to playlist");
        }
        setAlertMessage("Added to playlist!");
        setTimeout(() => setAlertMessage(null), 3000);
    };

    const handleCreatePlaylist = async (name: string, description?: string) => {
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
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] pb-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Side-by-side layout */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Left Column - Artwork (sticky on desktop) */}
                    <div className="lg:w-80 xl:w-96 flex-shrink-0">
                        <div className="lg:sticky lg:top-8">
                            <img
                                src={
                                    currentEpisode.artworkUrl ||
                                    currentEpisode.podcast.artworkUrl ||
                                    "/placeholder-artwork.png"
                                }
                                alt={currentEpisode.title}
                                className="w-full max-w-[320px] mx-auto lg:max-w-none aspect-square rounded-[24px] shadow-2xl object-cover"
                            />
                            {!isPlaying && (() => {
                                // Check if there's any progress - either from saved progress or current playback position
                                const hasSavedProgress = episodeDetails?.progress && 
                                    episodeDetails.progress.positionSeconds > 0 && 
                                    !episodeDetails.progress.completed;
                                const hasCurrentProgress = currentTime > 0;
                                const hasProgress = hasSavedProgress || hasCurrentProgress;
                                
                                return (
                                    <>
                                        <Button
                                            variant="primary"
                                            size="md"
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`/api/episodes/${currentEpisode.id}`);
                                                    if (!res.ok) {
                                                        throw new Error("Failed to fetch episode");
                                                    }
                                                    const data = await res.json();
                                                    // Use current time if available, otherwise use saved progress
                                                    let startPosition: number | undefined;
                                                    if (hasCurrentProgress) {
                                                        startPosition = currentTime;
                                                    } else if (hasSavedProgress) {
                                                        startPosition = episodeDetails.progress.positionSeconds;
                                                    }
                                                    await playEpisode({
                                                        id: data.id,
                                                        title: data.title,
                                                        audioUrl: data.audioUrl,
                                                        artworkUrl: data.artworkUrl,
                                                        podcast: {
                                                            id: data.podcast.id,
                                                            title: data.podcast.title,
                                                            artworkUrl: data.podcast.artworkUrl,
                                                        },
                                                    }, startPosition);
                                                } catch (error) {
                                                    console.error("Error playing episode:", error);
                                                    setAlertMessage("Failed to play episode. Please try again.");
                                                }
                                            }}
                                            className="w-full mt-4"
                                        >
                                            <PlayIcon className="h-5 w-5 mr-2 inline" />
                                            {hasProgress ? "Continue" : "Play"}
                                        </Button>
                                        {hasProgress && (
                                            <Button
                                                variant="secondary"
                                                size="md"
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`/api/episodes/${currentEpisode.id}`);
                                                        if (!res.ok) {
                                                            throw new Error("Failed to fetch episode");
                                                        }
                                                        const data = await res.json();
                                                        // Play from beginning (position 0)
                                                        await playEpisode({
                                                            id: data.id,
                                                            title: data.title,
                                                            audioUrl: data.audioUrl,
                                                            artworkUrl: data.artworkUrl,
                                                            podcast: {
                                                                id: data.podcast.id,
                                                                title: data.podcast.title,
                                                                artworkUrl: data.podcast.artworkUrl,
                                                            },
                                                        }, 0);
                                                    } catch (error) {
                                                        console.error("Error playing episode:", error);
                                                        setAlertMessage("Failed to play episode. Please try again.");
                                                    }
                                                }}
                                                className="w-full mt-3"
                                            >
                                                <PlayIcon className="h-5 w-5 mr-2 inline" />
                                                Start Over
                                            </Button>
                                        )}
                                    </>
                                );
                            })()}
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => setShowAddToPlaylistModal(true)}
                                className={`w-full ${!isPlaying ? "mt-3" : "mt-4"}`}
                            >
                                <PlusIcon className="h-5 w-5 mr-2 inline" />
                                Add to Playlist
                            </Button>
                        </div>
                    </div>

                    {/* Right Column - Episode Info & Shownotes */}
                    <div className="flex-1 min-w-0">
                        {/* Episode Header */}
                        <div className="mb-8">
                            <Link
                                href={`/podcasts/${currentEpisode.podcast.id}`}
                                className="text-sm text-[#a0a0a0] hover:text-[#FF3B30] mb-2 inline-block transition-colors"
                            >
                                {currentEpisode.podcast.title}
                            </Link>
                            <h1
                                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4"
                                style={{
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                }}
                            >
                                {currentEpisode.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-[#a0a0a0]">
                                {episodeDetails?.publishedAt && (
                                    <span>
                                        {formatDate(episodeDetails.publishedAt, userDateFormat)}
                                    </span>
                                )}
                                {episodeDetails?.durationSeconds && (
                                    <>
                                        <span className="text-[#3a3a3a]">
                                            |
                                        </span>
                                        <span>
                                            {formatTime(
                                                episodeDetails.durationSeconds
                                            )}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Shownotes */}
                        {episodeDetails?.description ? (
                            <div className="bg-[#1f1f1f] rounded-[20px] border border-[#2a2a2a] p-6">
                                <h2 className="text-xl font-bold text-white mb-4">
                                    Shownotes
                                </h2>
                                <Shownotes
                                    content={episodeDetails.description}
                                    maxLength={10000}
                                />
                            </div>
                        ) : (
                            <div className="bg-[#1f1f1f] rounded-[20px] border border-[#2a2a2a] p-6">
                                <p className="text-[#a0a0a0]">
                                    No shownotes available for this episode.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showAddToPlaylistModal && (
                <AddToPlaylistModal
                    onClose={() => setShowAddToPlaylistModal(false)}
                    onAddToPlaylist={handleAddToPlaylist}
                    onCreatePlaylist={handleCreatePlaylist}
                    episodeId={currentEpisode.id}
                />
            )}

            {alertMessage && (
                <div className="fixed bottom-40 right-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-[12px] px-4 py-3 text-white shadow-lg z-50">
                    {alertMessage}
                </div>
            )}
        </div>
    );
}
