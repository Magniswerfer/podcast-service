"use client";

import { SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@/components/Tooltip";

interface ControlsProps {
    playbackRate: number;
    onPlaybackRateChange: (rate: number) => void;
    volume: number;
    onVolumeChange: (volume: number) => void;
}

export function Controls({
    playbackRate,
    onPlaybackRateChange,
    volume,
    onVolumeChange,
}: ControlsProps) {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    return (
        <div className="flex items-center space-x-4">
            {/* Playback Speed */}
            <Tooltip content={`Speed: ${playbackRate}x`} position="top">
                <select
                    value={playbackRate}
                    onChange={(e) =>
                        onPlaybackRateChange(parseFloat(e.target.value))}
                    className="text-xs bg-[#252525] border border-[#2a2a2a] rounded-[8px] px-2 py-1 text-[#e5e5e5] hover:border-[#FF3B30] focus:border-[#FF3B30] focus:outline-none transition-all duration-200 cursor-pointer"
                >
                    {speeds.map((speed) => (
                        <option
                            key={speed}
                            value={speed}
                            className="bg-[#1f1f1f]"
                        >
                            {speed}x
                        </option>
                    ))}
                </select>
            </Tooltip>

            {/* Volume */}
            <Tooltip
                content={`Volume: ${Math.round(volume * 100)}%`}
                position="top"
            >
                <div className="flex items-center space-x-2">
                    <SpeakerWaveIcon className="h-5 w-5 text-[#a0a0a0]" />
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) =>
                            onVolumeChange(parseFloat(e.target.value))}
                        className="w-20 h-1.5 bg-[#2a2a2a] rounded-full appearance-none cursor-pointer accent-[#FF3B30]"
                        style={{
                            background:
                                `linear-gradient(to right, #FF3B30 0%, #FF3B30 ${
                                    volume * 100
                                }%, #2a2a2a ${volume * 100}%, #2a2a2a 100%)`,
                        }}
                    />
                </div>
            </Tooltip>
        </div>
    );
}
