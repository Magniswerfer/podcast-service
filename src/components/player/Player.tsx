"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    BackwardIcon,
    ForwardIcon,
    PauseIcon,
    PlayIcon,
    QueueListIcon,
    ChevronDownIcon,
    ChevronUpIcon,
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
        isMinimized,
        togglePlayPause,
        skipForward,
        skipBackward,
        handleSeek,
        setPlaybackRate,
        setVolume,
        toggleMinimized,
    } = usePlayer();

    const [showQueue, setShowQueue] = useState(false);

    // Only show player when there is a current episode
    if (!currentEpisode) {
        return null;
    }

    const handlePlayerClick = () => {
        router.push("/player");
    };

    // Minimized view - compact player
    if (isMinimized) {
        return (
            <div
                className="fixed left-2 right-2 sm:left-4 sm:right-4 lg:left-24 lg:right-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-[16px] sm:rounded-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.4)] z-40 transition-all duration-300"
                style={{
                    bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
                }}
            >
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
                    <div className="flex items-center gap-3">
                        {/* Episode Artwork - Clickable */}
                        <div
                            className="shrink-0 cursor-pointer"
                            onClick={handlePlayerClick}
                        >
                            <img
                                src={currentEpisode.artworkUrl ||
                                    currentEpisode.podcast.artworkUrl ||
                                    "/placeholder-artwork.png"}
                                alt={currentEpisode.title}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-[10px] object-cover shadow-lg"
                            />
                        </div>

                        {/* Episode Info - Clickable */}
                        <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={handlePlayerClick}
                        >
                            <p className="text-xs sm:text-sm font-medium text-white truncate">
                                {currentEpisode.title}
                            </p>
                            <p className="text-xs text-[#a0a0a0] truncate">
                                {currentEpisode.podcast.title}
                            </p>
                        </div>

                        {/* Play/Pause Button */}
                        <Tooltip
                            content={isPlaying ? "Pause" : "Play"}
                            position="top"
                        >
                            <button
                                onClick={togglePlayPause}
                                className="p-2 rounded-full bg-[#FF3B30] hover:bg-[#FF5247] text-white shadow-[0_2px_8px_rgba(255,59,48,0.3)] transition-all duration-200 active:scale-95"
                            >
                                {isPlaying
                                    ? <PauseIcon className="h-5 w-5" />
                                    : <PlayIcon className="h-5 w-5" />}
                            </button>
                        </Tooltip>

                        {/* Maximize Button */}
                        <Tooltip content="Expand player" position="top">
                            <button
                                onClick={toggleMinimized}
                                className="p-2 rounded-full text-[#a0a0a0] hover:text-white hover:bg-[#252525] transition-all duration-200 active:scale-95"
                            >
                                <ChevronUpIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        );
    }

    // Maximized view - full player
    return (
        <div
            className="fixed left-2 right-2 sm:left-4 sm:right-4 lg:left-24 lg:right-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-[16px] sm:rounded-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.4)] z-40 transition-all duration-300"
            style={{
                bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
            }}
        >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                {/* Progress Bar - Full Width */}
                <div className="mb-3 sm:mb-4">
                    <ProgressBar
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek}
                    />
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Episode Artwork - Clickable, smaller on mobile */}
                    <div
                        className="shrink-0 cursor-pointer"
                        onClick={handlePlayerClick}
                    >
                        <img
                            src={currentEpisode.artworkUrl ||
                                currentEpisode.podcast.artworkUrl ||
                                "/placeholder-artwork.png"}
                            alt={currentEpisode.title}
                            className="h-12 w-12 sm:h-16 sm:w-16 rounded-[12px] sm:rounded-[16px] object-cover shadow-lg"
                        />
                    </div>

                    {/* Episode Info - Clickable */}
                    <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={handlePlayerClick}
                    >
                        <p className="text-xs sm:text-sm font-medium text-white truncate">
                            {currentEpisode.title}
                        </p>
                        <p className="text-xs text-[#a0a0a0] truncate">
                            {currentEpisode.podcast.title}
                        </p>
                    </div>

                    {/* Controls - simplified on mobile */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Skip back - hidden on mobile */}
                        <Tooltip content="Skip backward 15s" position="top">
                            <button
                                onClick={skipBackward}
                                className="hidden sm:flex p-2 rounded-full text-[#a0a0a0] hover:text-white hover:bg-[#252525] transition-all duration-200 active:scale-95"
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
                                className="p-2.5 sm:p-3 rounded-full bg-[#FF3B30] hover:bg-[#FF5247] text-white shadow-[0_2px_8px_rgba(255,59,48,0.3)] hover:shadow-[0_4px_12px_rgba(255,59,48,0.4)] transition-all duration-200 active:scale-95"
                            >
                                {isPlaying
                                    ? <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                    : <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                            </button>
                        </Tooltip>
                        {/* Skip forward - hidden on mobile */}
                        <Tooltip content="Skip forward 15s" position="top">
                            <button
                                onClick={skipForward}
                                className="hidden sm:flex p-2 rounded-full text-[#a0a0a0] hover:text-white hover:bg-[#252525] transition-all duration-200 active:scale-95"
                            >
                                <ForwardIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    </div>

                    {/* Speed & Volume Controls - hidden on mobile */}
                    <div className="hidden md:block">
                        <Controls
                            playbackRate={playbackRate}
                            onPlaybackRateChange={setPlaybackRate}
                            volume={volume}
                            onVolumeChange={setVolume}
                        />
                    </div>

                    {/* Queue Toggle - hidden on mobile */}
                    <Tooltip content="Queue" position="top">
                        <button
                            onClick={() => setShowQueue(!showQueue)}
                            className={`hidden sm:flex p-2 rounded-full text-[#a0a0a0] hover:text-white hover:bg-[#252525] transition-all duration-200 active:scale-95 ${
                                showQueue ? "text-[#FF3B30] bg-[#252525]" : ""
                            }`}
                        >
                            <QueueListIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>

                    {/* Minimize Button */}
                    <Tooltip content="Minimize player" position="top">
                        <button
                            onClick={toggleMinimized}
                            className="p-2 rounded-full text-[#a0a0a0] hover:text-white hover:bg-[#252525] transition-all duration-200 active:scale-95"
                        >
                            <ChevronDownIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Queue Preview - Expands below player controls, hidden on mobile */}
            {showQueue && (
                <div className="hidden sm:block border-t border-[#2a2a2a] pt-4 pb-4">
                    <QueuePreview onClose={() => setShowQueue(false)} />
                </div>
            )}
        </div>
    );
}
