'use client';

import { SpeakerWaveIcon } from '@heroicons/react/24/outline';

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
      <select
        value={playbackRate}
        onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
        className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
      >
        {speeds.map((speed) => (
          <option key={speed} value={speed}>
            {speed}x
          </option>
        ))}
      </select>

      {/* Volume */}
      <div className="flex items-center space-x-2">
        <SpeakerWaveIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
