"use client";

import { usePlayer } from "@/contexts/PlayerContext";

interface QueuePreviewProps {
    onClose: () => void;
}

export function QueuePreview({ onClose }: QueuePreviewProps) {
    const { queue, playEpisode, currentEpisode } = usePlayer();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Queue</h3>
                <button
                    onClick={onClose}
                    className="text-[#a0a0a0] hover:text-white transition-colors"
                >
                    Close
                </button>
            </div>
            {queue.length === 0
                ? <p className="text-sm text-[#a0a0a0]">Queue is empty</p>
                : (
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {queue.map((item) => {
                            const isCurrentlyPlaying =
                                currentEpisode?.id === item.episode.id;
                            return (
                                <li
                                    key={item.id}
                                    onClick={() => {
                                        if (!isCurrentlyPlaying) {
                                            playEpisode({
                                                id: item.episode.id,
                                                title: item.episode.title,
                                                audioUrl: item.episode.audioUrl,
                                                artworkUrl:
                                                    item.episode.artworkUrl,
                                                podcast: {
                                                    id: item.episode.podcast
                                                        .id,
                                                    title: item.episode.podcast
                                                        .title,
                                                    artworkUrl:
                                                        item.episode.podcast
                                                            .artworkUrl,
                                                },
                                            });
                                        }
                                    }}
                                    className={`flex items-center space-x-3 p-2 rounded-[12px] cursor-pointer transition-all duration-200 ${
                                        isCurrentlyPlaying
                                            ? "bg-[#FF3B30]/20 border border-[#FF3B30]"
                                            : "hover:bg-[#252525]"
                                    }`}
                                >
                                    <img
                                        src={item.episode.artworkUrl ||
                                            item.episode.podcast
                                                .artworkUrl ||
                                            "/placeholder-artwork.png"}
                                        alt={item.episode.title}
                                        className="h-12 w-12 rounded-[8px] object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {item.episode.title}
                                            {isCurrentlyPlaying && (
                                                <span className="ml-2 text-xs text-[#FF3B30]">
                                                    (Playing)
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-[#a0a0a0] truncate">
                                            {item.episode.podcast.title}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
        </div>
    );
}
