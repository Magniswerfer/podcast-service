"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    BackwardIcon,
    ForwardIcon,
    PauseIcon,
    PlayIcon,
    QueueListIcon,
} from "@heroicons/react/24/solid";
import { ProgressBar } from "./ProgressBar";
import { Controls } from "./Controls";
import { QueuePreview } from "./QueuePreview";
import { usePlayer } from "@/contexts/PlayerContext";
import { Tooltip } from "@/components/Tooltip";

export function Player() {
    const router = useRouter();
    const {
        currentEpisode,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        volume,
        togglePlayPause,
        skipForward,
        skipBackward,
        handleSeek,
        setPlaybackRate,
        setVolume,
    } = usePlayer();

    const [showQueue, setShowQueue] = useState(false);

    // Only show player when episode is playing
    if (!currentEpisode || !isPlaying) {
        return null;
    }

    const handlePlayerClick = () => {
        router.push("/player");
    };

    return (
        <div className="fixed bottom-4 left-4 right-4 lg:left-24 lg:right-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.4)] z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Progress Bar - Full Width */}
                <div className="mb-4">
                    <ProgressBar
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek}
                    />
                </div>

                <div className="flex items-center space-x-4">
                    {/* Episode Artwork - Clickable */}
                    <div
                        className="flex-shrink-0 cursor-pointer"
                        onClick={handlePlayerClick}
                    >
                        <img
                            src={currentEpisode.artworkUrl ||
                                currentEpisode.podcast.artworkUrl ||
                                "/placeholder-artwork.png"}
                            alt={currentEpisode.title}
                            className="h-16 w-16 rounded-[16px] object-cover shadow-lg"
                        />
                    </div>

                    {/* Episode Info - Clickable */}
                    <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={handlePlayerClick}
                    >
                        <p className="text-sm font-medium text-white truncate">
                            {currentEpisode.title}
                        </p>
                        <p className="text-xs text-[#a0a0a0] truncate">
                            {currentEpisode.podcast.title}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center space-x-2">
                        <Tooltip content="Skip backward 15s" position="top">
                            <button
                                onClick={skipBackward}
                                className="p-2 rounded-full text-[#a0a0a0] hover:text-white hover:bg-[#252525] transition-all duration-200 active:scale-95"
                            >
                                <BackwardIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                        <Tooltip
                            content={isPlaying ? "Pause" : "Play"}
                            position="top"
                        >
                            <button
                                onClick={togglePlayPause}
                                className="p-3 rounded-full bg-[#FF3B30] hover:bg-[#FF5247] text-white shadow-[0_2px_8px_rgba(255,59,48,0.3)] hover:shadow-[0_4px_12px_rgba(255,59,48,0.4)] transition-all duration-200 active:scale-95"
                            >
                                {isPlaying
                                    ? <PauseIcon className="h-6 w-6" />
                                    : <PlayIcon className="h-6 w-6" />}
                            </button>
                        </Tooltip>
                        <Tooltip content="Skip forward 15s" position="top">
                            <button
                                onClick={skipForward}
                                className="p-2 rounded-full text-[#a0a0a0] hover:text-white hover:bg-[#252525] transition-all duration-200 active:scale-95"
                            >
                                <ForwardIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    </div>

                    {/* Speed & Volume Controls */}
                    <Controls
                        playbackRate={playbackRate}
                        onPlaybackRateChange={setPlaybackRate}
                        volume={volume}
                        onVolumeChange={setVolume}
                    />

                    {/* Queue Toggle */}
                    <Tooltip content="Queue" position="top">
                        <button
                            onClick={() => setShowQueue(!showQueue)}
                            className={`p-2 rounded-full text-[#a0a0a0] hover:text-white hover:bg-[#252525] transition-all duration-200 active:scale-95 ${
                                showQueue ? "text-[#FF3B30] bg-[#252525]" : ""
                            }`}
                        >
                            <QueueListIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Queue Preview - Expands below player controls */}
            {showQueue && (
                <div className="border-t border-[#2a2a2a] pt-4 pb-4">
                    <QueuePreview onClose={() => setShowQueue(false)} />
                </div>
            )}
        </div>
    );
}
