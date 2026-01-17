"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/Tooltip";
import { EpisodeMenu } from "@/components/EpisodeMenu";
import { PlayIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AlertModal } from "@/components/AlertModal";
import { ConfirmModal } from "@/components/ConfirmModal";

interface QueueItem {
    id: string;
    episodeId: string;
    episode: {
        id: string;
        title: string;
        audioUrl: string;
        artworkUrl?: string;
        durationSeconds?: number;
        podcast: {
            id: string;
            title: string;
            artworkUrl?: string;
        };
        progress?: {
            positionSeconds: number;
            durationSeconds?: number;
            completed: boolean;
        } | null;
    };
    position: number;
}

export default function QueuePage() {
    const { queue, loadQueue, playEpisode, currentEpisode, clearQueue } =
        usePlayer();
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);
    const [clearing, setClearing] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        // Only load if queue is empty (PlayerContext already loads on mount)
        if (queue.length === 0) {
            const fetchQueue = async () => {
                await loadQueue();
                setLoading(false);
            };
            fetchQueue();
        } else {
            setLoading(false);
        }
    }, []); // Empty dependency array - only run on mount

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${
                secs.toString().padStart(2, "0")
            }`;
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const getProgressPercentage = (episode: QueueItem["episode"]) => {
        if (!episode.progress || !episode.durationSeconds) return 0;
        return (episode.progress.positionSeconds / episode.durationSeconds) *
            100;
    };

    const handlePlay = async (queueItem: QueueItem) => {
        try {
            const hasProgress = queueItem.episode.progress &&
                queueItem.episode.progress.positionSeconds > 0 &&
                !queueItem.episode.progress.completed;
            const startPosition = hasProgress
                ? queueItem.episode.progress!.positionSeconds
                : undefined;

            await playEpisode({
                id: queueItem.episode.id,
                title: queueItem.episode.title,
                audioUrl: queueItem.episode.audioUrl,
                artworkUrl: queueItem.episode.artworkUrl,
                podcast: {
                    id: queueItem.episode.podcast.id,
                    title: queueItem.episode.podcast.title,
                    artworkUrl: queueItem.episode.podcast.artworkUrl,
                },
            }, startPosition);
        } catch (error) {
            console.error("Error playing episode:", error);
            setAlertMessage("Failed to play episode. Please try again.");
        }
    };

    const handleRemove = async (queueItemId: string) => {
        setRemoving(queueItemId);
        try {
            const response = await fetch(`/api/queue/${queueItemId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                // Optimistically update queue by removing the item
                // The PlayerContext will sync on next loadQueue call
                await loadQueue();
            } else {
                const error = await response.json();
                setAlertMessage(error.error || "Failed to remove from queue");
            }
        } catch (error) {
            console.error("Error removing from queue:", error);
            setAlertMessage("Failed to remove from queue. Please try again.");
        } finally {
            setRemoving(null);
        }
    };

    const handleClearQueue = async () => {
        setShowClearConfirm(true);
    };

    const confirmClearQueue = async () => {
        setShowClearConfirm(false);
        setClearing(true);
        try {
            await clearQueue();
        } catch (error) {
            console.error("Error clearing queue:", error);
            setAlertMessage("Failed to clear queue. Please try again.");
        } finally {
            setClearing(false);
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
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">
                    Queue
                </h1>
                {queue.length > 0 && (
                    <Button
                        variant="secondary"
                        onClick={handleClearQueue}
                        disabled={clearing}
                    >
                        <XMarkIcon className="h-5 w-5 mr-2" />
                        {clearing ? "Clearing..." : "Clear Queue"}
                    </Button>
                )}
            </div>

            {queue.length === 0
                ? (
                    <div className="text-center py-12">
                        <p className="text-[#a0a0a0] mb-4">
                            Your queue is empty
                        </p>
                        <a
                            href="/discover"
                            className="text-[#FF3B30] hover:text-[#FF5247] transition-colors"
                        >
                            Discover podcasts
                        </a>
                    </div>
                )
                : (
                    <div className="space-y-3">
                        {queue.map((item) => {
                            const isCurrentlyPlaying =
                                currentEpisode?.id === item.episode.id;
                            const isCompleted = item.episode.progress?.completed === true;
                            const hasProgress = item.episode.progress &&
                                item.episode.progress.positionSeconds > 0 &&
                                !item.episode.progress.completed;
                            const progressPercentage = isCompleted ? 100 : getProgressPercentage(
                                item.episode,
                            );

                            return (
                                <Card
                                    key={item.id}
                                    interactive={false}
                                    className={`p-4 ${
                                        isCurrentlyPlaying
                                            ? "border-[#FF3B30] ring-2 ring-[#FF3B30]"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <span className="text-[#a0a0a0] font-mono w-8 text-center">
                                            {item.position + 1}
                                        </span>
                                        <img
                                            src={item.episode.artworkUrl ||
                                                item.episode.podcast
                                                    .artworkUrl ||
                                                "/placeholder-artwork.png"}
                                            alt={item.episode.title}
                                            className="h-16 w-16 rounded-[12px] object-cover shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <h3 className="font-medium text-white truncate">
                                                    {item.episode.title}
                                                    {isCurrentlyPlaying && (
                                                        <span className="ml-2 text-xs text-[#FF3B30]">
                                                            (Now Playing)
                                                        </span>
                                                    )}
                                                </h3>
                                                <div className="ml-2 shrink-0">
                                                    <EpisodeMenu
                                                        episodeId={item.episode
                                                            .id}
                                                        episode={{
                                                            id: item.episode.id,
                                                            title:
                                                                item.episode
                                                                    .title,
                                                            audioUrl:
                                                                item.episode
                                                                    .audioUrl,
                                                            artworkUrl:
                                                                item.episode
                                                                    .artworkUrl,
                                                            podcast: {
                                                                id: item.episode
                                                                    .podcast.id,
                                                                title:
                                                                    item.episode
                                                                        .podcast
                                                                        .title,
                                                                artworkUrl:
                                                                    item.episode
                                                                        .podcast
                                                                        .artworkUrl,
                                                            },
                                                        }}
                                                        progress={item.episode
                                                            .progress}
                                                        durationSeconds={item.episode.durationSeconds}
                                                        onMarkedAsPlayed={async () => {
                                                            // Reload queue to refresh episode progress data
                                                            await loadQueue();
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-sm text-[#a0a0a0] truncate mb-2">
                                                {item.episode.podcast.title}
                                            </p>
                                            <div className="mb-2 min-h-10">
                                                {isCompleted &&
                                                item.episode.durationSeconds ? (
                                                    <>
                                                        <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mb-1">
                                                            <div
                                                                className="bg-[#FF3B30] h-1.5 rounded-full transition-all duration-300"
                                                                style={{
                                                                    width: '100%',
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
                                                            <span>
                                                                {formatTime(
                                                                    item.episode
                                                                        .durationSeconds,
                                                                )} /{" "}
                                                                {formatTime(
                                                                    item.episode
                                                                        .durationSeconds,
                                                                )}
                                                            </span>
                                                            <span className="text-[#FF3B30]">Completed</span>
                                                        </div>
                                                    </>
                                                ) : hasProgress &&
                                                item.episode.durationSeconds ? (
                                                    <>
                                                        <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mb-1">
                                                            <div
                                                                className="bg-[#FF3B30] h-1.5 rounded-full transition-all duration-300"
                                                                style={{
                                                                    width:
                                                                        `${progressPercentage}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
                                                            <span>
                                                                {formatTime(
                                                                    item.episode
                                                                        .progress!
                                                                        .positionSeconds,
                                                                )} /{" "}
                                                                {formatTime(
                                                                    item.episode
                                                                        .durationSeconds,
                                                                )}
                                                            </span>
                                                            <span>
                                                                {Math.round(
                                                                    progressPercentage,
                                                                )}% complete
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mb-1">
                                                            <div className="h-1.5 rounded-full" />
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
                                                            <span>
                                                                {item.episode.durationSeconds
                                                                    ? formatTime(
                                                                        item.episode
                                                                            .durationSeconds,
                                                                    )
                                                                    : "Duration unknown"}
                                                            </span>
                                                            <span>Not started</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Tooltip
                                                content={isCurrentlyPlaying
                                                    ? "Currently Playing"
                                                    : (hasProgress
                                                        ? "Continue playing"
                                                        : "Play")}
                                                position="top"
                                            >
                                                <Button
                                                    variant="icon"
                                                    onClick={() =>
                                                        handlePlay(item)}
                                                    disabled={isCurrentlyPlaying}
                                                >
                                                    <PlayIcon className="h-5 w-5" />
                                                </Button>
                                            </Tooltip>
                                            <Tooltip
                                                content="Remove"
                                                position="top"
                                            >
                                                <Button
                                                    variant="icon"
                                                    onClick={() =>
                                                        handleRemove(item.id)}
                                                    disabled={removing ===
                                                        item.id}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

            {alertMessage && (
                <AlertModal
                    message={alertMessage}
                    onClose={() => setAlertMessage(null)}
                    title="Error"
                />
            )}

            {showClearConfirm && (
                <ConfirmModal
                    message="Are you sure you want to clear your entire queue?"
                    onConfirm={confirmClearQueue}
                    onCancel={() => setShowClearConfirm(false)}
                    title="Clear Queue"
                    confirmText="Clear"
                    cancelText="Cancel"
                />
            )}
        </div>
    );
}
