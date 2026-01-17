"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePlayer } from "@/contexts/PlayerContext";
import { QueueActions } from "@/components/QueueActions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/Tooltip";
import { EpisodeMenu } from "@/components/EpisodeMenu";
import {
    ArrowPathIcon,
    PlayIcon,
    TrashIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { AlertModal } from "@/components/AlertModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";
import { EpisodeFilterSort } from "@/components/EpisodeFilterSort";
import { PodcastFilterSettings } from "@/types/index";
import { formatDate, useDateFormat } from "@/lib/date-format";
import { stripHtml } from "@/lib/html-utils";

interface Episode {
    id: string;
    title: string;
    description?: string;
    descriptionPlain?: string;
    publishedAt: string;
    durationSeconds?: number;
    artworkUrl?: string;
    audioUrl?: string;
    podcast?: {
        id: string;
        title: string;
        artworkUrl?: string;
    };
    progress?: {
        positionSeconds: number;
        durationSeconds?: number;
        completed: boolean;
    } | null;
}

interface Podcast {
    id: string;
    title: string;
    description?: string;
    artworkUrl?: string;
    author?: string;
    customSettings?: PodcastFilterSettings;
}

export default function PodcastDetailPage() {
    const params = useParams();
    const podcastId = params.id as string;
    const userDateFormat = useDateFormat();
    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalEpisodes, setTotalEpisodes] = useState(0);
    const [currentOffset, setCurrentOffset] = useState(0);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
    const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unplayed' | 'uncompleted' | 'in-progress'>('all');
    const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
    const [savedSettings, setSavedSettings] = useState<PodcastFilterSettings | undefined>(undefined);
    const { playEpisode } = usePlayer();
    const EPISODES_PER_PAGE = 20;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch podcasts to get the specific podcast details
                const podcastsResponse = await fetch("/api/podcasts");
                if (!podcastsResponse.ok) {
                    if (podcastsResponse.status === 401) {
                        window.location.href = "/login";
                        return;
                    }
                    throw new Error("Failed to fetch podcast");
                }
                const podcastsData = await podcastsResponse.json();
                const foundPodcast = podcastsData.podcasts?.find((p: any) =>
                    p.id === podcastId
                );

                if (!foundPodcast) {
                    setLoading(false);
                    return;
                }

                const podcastData = {
                    id: foundPodcast.id,
                    title: foundPodcast.title,
                    description: foundPodcast.description,
                    artworkUrl: foundPodcast.artworkUrl,
                    author: foundPodcast.author,
                    customSettings: foundPodcast.customSettings as PodcastFilterSettings | undefined,
                };
                setPodcast(podcastData);
                
                // Load saved settings
                if (podcastData.customSettings) {
                    setSavedSettings(podcastData.customSettings);
                    setFilter(podcastData.customSettings.episodeFilter || 'all');
                    setSort(podcastData.customSettings.episodeSort || 'newest');
                }

                // Build episodes URL with filter and sort
                const filterParam = podcastData.customSettings?.episodeFilter || 'all';
                const sortParam = podcastData.customSettings?.episodeSort || 'newest';
                const episodesUrl = `/api/episodes?podcastId=${podcastId}&limit=${EPISODES_PER_PAGE}&offset=0&filter=${filterParam}&sort=${sortParam}`;
                
                // Fetch episodes for this podcast (initial load)
                const episodesResponse = await fetch(episodesUrl);
                if (episodesResponse.ok) {
                    const episodesData = await episodesResponse.json();
                    setEpisodes(episodesData.episodes || []);
                    setTotalEpisodes(episodesData.total || 0);
                    setCurrentOffset(episodesData.episodes?.length || 0);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (podcastId) {
            fetchData();
        }
    }, [podcastId]);

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const fetchEpisodes = async (
        offset: number, 
        reset: boolean = false,
        filterParam: typeof filter = filter,
        sortParam: typeof sort = sort
    ) => {
        const episodesUrl = `/api/episodes?podcastId=${podcastId}&limit=${EPISODES_PER_PAGE}&offset=${offset}&filter=${filterParam}&sort=${sortParam}`;
        const episodesResponse = await fetch(episodesUrl);
        
        if (episodesResponse.ok) {
            const episodesData = await episodesResponse.json();
            if (reset) {
                setEpisodes(episodesData.episodes || []);
                setCurrentOffset(episodesData.episodes?.length || 0);
            } else {
                setEpisodes((prev) => [...prev, ...(episodesData.episodes || [])]);
                setCurrentOffset((prev) => prev + (episodesData.episodes?.length || 0));
            }
            setTotalEpisodes(episodesData.total || 0);
        }
        return episodesResponse.ok;
    };

    const loadMoreEpisodes = async () => {
        if (loadingMore || currentOffset >= totalEpisodes) return;
        
        setLoadingMore(true);
        try {
            await fetchEpisodes(currentOffset, false, filter, sort);
        } catch (error) {
            console.error("Error loading more episodes:", error);
            setAlertMessage("Failed to load more episodes");
        } finally {
            setLoadingMore(false);
        }
    };

    const handleFilterChange = async (newFilter: typeof filter, newSort: typeof sort) => {
        setFilter(newFilter);
        setSort(newSort);
        setCurrentOffset(0);
        
        // Reset and fetch with new filter/sort - pass values directly to avoid stale state
        setLoading(true);
        try {
            await fetchEpisodes(0, true, newFilter, newSort);
        } catch (error) {
            console.error("Error fetching episodes:", error);
            setAlertMessage("Failed to filter episodes");
            throw error; // Re-throw so component can handle it
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async (settings: PodcastFilterSettings) => {
        try {
            const response = await fetch(`/api/podcasts/${podcastId}/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save preferences');
            }

            const data = await response.json();
            setSavedSettings(data.customSettings);
            setAlertMessage("Preferences saved!");
        } catch (error) {
            console.error("Error saving preferences:", error);
            setAlertMessage("Failed to save preferences");
            throw error;
        }
    };

    const hasMoreEpisodes = currentOffset < totalEpisodes;

    const getProgressPercentage = (episode: Episode) => {
        if (!episode.progress || !episode.durationSeconds) return 0;
        return (episode.progress.positionSeconds / episode.durationSeconds) * 100;
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-[#a0a0a0]">Loading...</div>
            </div>
        );
    }

    if (!podcast) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <p className="text-[#a0a0a0]">Podcast not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Podcast Header */}
            <Card className="p-6 mb-8">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                    <img
                        src={podcast.artworkUrl || "/placeholder-artwork.png"}
                        alt={podcast.title}
                        className="w-48 h-48 rounded-[20px] object-cover shrink-0 shadow-lg"
                    />
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {podcast.title}
                        </h1>
                        {podcast.author && (
                            <p className="text-lg text-[#a0a0a0] mb-4">
                                {podcast.author}
                            </p>
                        )}
                        {podcast.description && (
                            <p className="text-[#e5e5e5] mb-4">
                                {stripHtml(podcast.description)}
                            </p>
                        )}
                        <div className="flex space-x-3">
                            <Tooltip content="Refresh Episodes" position="top">
                                <Button
                                    variant="icon"
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(
                                                `/api/podcasts/${podcastId}/refresh`,
                                                {
                                                    method: "POST",
                                                },
                                            );
                                            if (response.ok) {
                                                // Refresh episodes with current filter/sort
                                                const episodesUrl = `/api/episodes?podcastId=${podcastId}&limit=${EPISODES_PER_PAGE}&offset=0&filter=${filter}&sort=${sort}`;
                                                const episodesResponse = await fetch(episodesUrl);
                                                if (episodesResponse.ok) {
                                                    const episodesData = await episodesResponse.json();
                                                    setEpisodes(episodesData.episodes || []);
                                                    setTotalEpisodes(episodesData.total || 0);
                                                    setCurrentOffset(episodesData.episodes?.length || 0);
                                                }
                                                setAlertMessage("Episodes refreshed!");
                                            } else {
                                                const error = await response
                                                    .json();
                                                setAlertMessage(
                                                    error.error ||
                                                        "Failed to refresh episodes",
                                                );
                                            }
                                        } catch (error) {
                                            console.error(
                                                "Error refreshing episodes:",
                                                error,
                                            );
                                            setAlertMessage("Failed to refresh episodes");
                                        }
                                    }}
                                >
                                    <ArrowPathIcon className="h-5 w-5" />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Add to Playlist" position="top">
                                <Button
                                    variant="icon"
                                    onClick={() => {
                                        setShowAddToPlaylistModal(true);
                                    }}
                                >
                                    <PlusIcon className="h-5 w-5" />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Unsubscribe" position="top">
                                <Button
                                    variant="icon"
                                    onClick={() => {
                                        setShowUnsubscribeConfirm(true);
                                    }}
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Episodes List */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-white">
                        Episodes
                    </h2>
                </div>
                
                {/* Filter and Sort Controls */}
                <EpisodeFilterSort
                    podcastId={podcastId}
                    savedSettings={savedSettings}
                    onFilterChange={handleFilterChange}
                    onSavePreferences={handleSavePreferences}
                />
                {episodes.length === 0
                    ? <p className="text-[#a0a0a0]">No episodes available</p>
                    : (
                        <div className="space-y-3">
                            {episodes.map((episode) => {
                                const isCompleted = episode.progress?.completed === true;
                                const hasProgress = episode.progress && 
                                    episode.progress.positionSeconds > 0 && 
                                    !episode.progress.completed;
                                const progressPercentage = isCompleted ? 100 : getProgressPercentage(episode);
                                
                                return (
                                    <Card
                                        key={episode.id}
                                        interactive={false}
                                        className="p-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                            {/* Top row on mobile: artwork + title + menu */}
                                            <div className="flex items-start gap-3 sm:contents">
                                                <Link
                                                    href={`/player?id=${episode.id}`}
                                                    className="shrink-0"
                                                >
                                                    <img
                                                        src={episode.artworkUrl ||
                                                            podcast.artworkUrl ||
                                                            "/placeholder-artwork.png"}
                                                        alt={episode.title}
                                                        className="w-16 h-16 rounded-[12px] object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                    />
                                                </Link>
                                                <div className="flex-1 min-w-0 sm:hidden">
                                                    <div className="flex items-start justify-between">
                                                        <Link
                                                            href={`/player?id=${episode.id}`}
                                                            className="flex-1 cursor-pointer"
                                                        >
                                                            <h3 className="font-medium text-white hover:text-[#FF3B30] transition-colors line-clamp-2">
                                                                {episode.title}
                                                            </h3>
                                                        </Link>
                                                        <div className="ml-2 shrink-0">
                                                            <EpisodeMenu
                                                                episodeId={episode.id}
                                                                episode={{
                                                                    id: episode.id,
                                                                    title: episode.title,
                                                                    audioUrl: episode.audioUrl || '',
                                                                    artworkUrl: episode.artworkUrl,
                                                                    podcast: {
                                                                        id: podcast.id,
                                                                        title: podcast.title,
                                                                        artworkUrl: podcast.artworkUrl,
                                                                    },
                                                                }}
                                                                progress={episode.progress}
                                                                durationSeconds={episode.durationSeconds}
                                                                onMarkedAsPlayed={async () => {
                                                                    await fetchEpisodes(0, true, filter, sort);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Desktop: episode info section */}
                                            <div className="hidden sm:block flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-1">
                                                    <Link
                                                        href={`/player?id=${episode.id}`}
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        <h3 className="font-medium text-white hover:text-[#FF3B30] transition-colors">
                                                            {episode.title}
                                                        </h3>
                                                    </Link>
                                                    <div className="ml-2 shrink-0">
                                                        <EpisodeMenu
                                                            episodeId={episode.id}
                                                            episode={{
                                                                id: episode.id,
                                                                title: episode.title,
                                                                audioUrl: episode.audioUrl || '',
                                                                artworkUrl: episode.artworkUrl,
                                                                podcast: {
                                                                    id: podcast.id,
                                                                    title: podcast.title,
                                                                    artworkUrl: podcast.artworkUrl,
                                                                },
                                                            }}
                                                            progress={episode.progress}
                                                            durationSeconds={episode.durationSeconds}
                                                            onMarkedAsPlayed={async () => {
                                                                await fetchEpisodes(0, true, filter, sort);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                {(episode.descriptionPlain || episode.description) && (
                                                    <p className="text-sm text-[#a0a0a0] line-clamp-2 mb-2">
                                                        {episode.descriptionPlain || stripHtml(episode.description || "")}
                                                    </p>
                                                )}
                                                <div className="mb-2 min-h-10">
                                                    {isCompleted && episode.durationSeconds ? (
                                                        <>
                                                            <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mb-1">
                                                                <div
                                                                    className="bg-[#FF3B30] h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: '100%' }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
                                                                <span>
                                                                    {formatTime(episode.durationSeconds)} / {formatTime(episode.durationSeconds)}
                                                                </span>
                                                                <span className="text-[#FF3B30]">Completed</span>
                                                            </div>
                                                        </>
                                                    ) : hasProgress && episode.durationSeconds ? (
                                                        <>
                                                            <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mb-1">
                                                                <div
                                                                    className="bg-[#FF3B30] h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: `${progressPercentage}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
                                                                <span>
                                                                    {formatTime(episode.progress!.positionSeconds)} / {formatTime(episode.durationSeconds)}
                                                                </span>
                                                                <span>
                                                                    {Math.round(progressPercentage)}% complete
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
                                                                    {episode.durationSeconds ? formatTime(episode.durationSeconds) : "Duration unknown"}
                                                                </span>
                                                                <span>Not started</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-4 text-xs text-[#a0a0a0]">
                                                    <span>
                                                        {formatDate(episode.publishedAt, userDateFormat)}
                                                    </span>
                                                    {episode.durationSeconds && (
                                                        <span>
                                                            {formatDuration(episode.durationSeconds)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Mobile: description, progress, and metadata */}
                                            <div className="sm:hidden">
                                                {(episode.descriptionPlain || episode.description) && (
                                                    <p className="text-sm text-[#a0a0a0] line-clamp-2 mb-2">
                                                        {episode.descriptionPlain || stripHtml(episode.description || "")}
                                                    </p>
                                                )}
                                                <div className="mb-2">
                                                    {isCompleted && episode.durationSeconds ? (
                                                        <>
                                                            <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mb-1">
                                                                <div
                                                                    className="bg-[#FF3B30] h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: '100%' }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
                                                                <span>
                                                                    {formatTime(episode.durationSeconds)} / {formatTime(episode.durationSeconds)}
                                                                </span>
                                                                <span className="text-[#FF3B30]">Completed</span>
                                                            </div>
                                                        </>
                                                    ) : hasProgress && episode.durationSeconds ? (
                                                        <>
                                                            <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mb-1">
                                                                <div
                                                                    className="bg-[#FF3B30] h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: `${progressPercentage}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
                                                                <span>
                                                                    {formatTime(episode.progress!.positionSeconds)} / {formatTime(episode.durationSeconds)}
                                                                </span>
                                                                <span>
                                                                    {Math.round(progressPercentage)}% complete
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
                                                                    {episode.durationSeconds ? formatTime(episode.durationSeconds) : "Duration unknown"}
                                                                </span>
                                                                <span>Not started</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-4 text-xs text-[#a0a0a0] mb-3">
                                                    <span>
                                                        {formatDate(episode.publishedAt, userDateFormat)}
                                                    </span>
                                                    {episode.durationSeconds && (
                                                        <span>
                                                            {formatDuration(episode.durationSeconds)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Action buttons - full width on mobile, fixed width on desktop */}
                                            <div className="flex flex-col gap-2 sm:shrink-0 sm:w-40">
                                                <Tooltip
                                                    content={hasProgress ? "Continue playing" : "Play"}
                                                    position="left"
                                                >
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch(`/api/episodes/${episode.id}`);
                                                                if (!res.ok) {
                                                                    throw new Error("Failed to fetch episode");
                                                                }
                                                                const data = await res.json();
                                                                const startPosition = hasProgress 
                                                                    ? episode.progress!.positionSeconds 
                                                                    : undefined;
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
                                                                console.error("Error fetching episode:", error);
                                                                setAlertMessage("Failed to load episode. Please try again.");
                                                            }
                                                        }}
                                                        className="w-full"
                                                    >
                                                        <PlayIcon className="h-4 w-4 mr-2 inline" />
                                                        {hasProgress ? "Continue" : "Play"}
                                                    </Button>
                                                </Tooltip>
                                                <QueueActions
                                                    episodeId={episode.id}
                                                    onSuccess={() => {
                                                        // Optionally show success message or refresh
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                {hasMoreEpisodes && (
                    <div className="mt-6 flex justify-center">
                        <Button
                            variant="secondary"
                            onClick={loadMoreEpisodes}
                            disabled={loadingMore}
                        >
                            {loadingMore ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                )}
            </div>

            {alertMessage && (
                <AlertModal
                    message={alertMessage}
                    onClose={() => setAlertMessage(null)}
                    title={alertMessage.includes("refreshed") ? "Success" : "Error"}
                />
            )}

            {showAddToPlaylistModal && (
                <AddToPlaylistModal
                    onClose={() => setShowAddToPlaylistModal(false)}
                    onAddToPlaylist={async (playlistId: string) => {
                        try {
                            const response = await fetch(
                                `/api/playlists/${playlistId}/items`,
                                {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ podcastId }),
                                }
                            );

                            if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || "Failed to add to playlist");
                            }

                            setShowAddToPlaylistModal(false);
                            setAlertMessage("Added to playlist!");
                        } catch (error) {
                            throw error;
                        }
                    }}
                    onCreatePlaylist={async (name: string, description?: string) => {
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
                    }}
                    podcastId={podcastId}
                />
            )}

            {showUnsubscribeConfirm && (
                <ConfirmModal
                    message="Are you sure you want to unsubscribe from this podcast?"
                    onConfirm={async () => {
                        setShowUnsubscribeConfirm(false);
                        try {
                            const response = await fetch(
                                `/api/podcasts/${podcastId}`,
                                {
                                    method: "DELETE",
                                },
                            );
                            if (response.ok) {
                                window.location.href = "/podcasts";
                            } else {
                                const error = await response.json();
                                setAlertMessage(
                                    error.error || "Failed to unsubscribe",
                                );
                            }
                        } catch (error) {
                            console.error("Error unsubscribing:", error);
                            setAlertMessage("Failed to unsubscribe");
                        }
                    }}
                    onCancel={() => setShowUnsubscribeConfirm(false)}
                    title="Unsubscribe"
                    confirmText="Unsubscribe"
                    cancelText="Cancel"
                />
            )}
        </div>
    );
}
