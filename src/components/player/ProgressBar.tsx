"use client";

interface ProgressBarProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
}

export function ProgressBar(
    { currentTime, duration, onSeek }: ProgressBarProps,
) {
    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;
        onSeek(newTime);
    };

    return (
        <div className="flex items-center space-x-3 text-xs text-[#a0a0a0]">
            <span className="font-mono w-12 text-right">
                {formatTime(currentTime)}
            </span>
            <div
                className="flex-1 h-1.5 bg-[#2a2a2a] rounded-full cursor-pointer relative group"
                onClick={handleClick}
            >
                <div
                    className="h-full bg-[#FF3B30] rounded-full transition-all duration-150"
                    style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                        className="h-3 w-3 bg-[#FF3B30] rounded-full shadow-lg"
                        style={{
                            left: `${percentage}%`,
                            transform: "translateX(-50%)",
                        }}
                    />
                </div>
            </div>
            <span className="font-mono w-12">{formatTime(duration)}</span>
        </div>
    );
}
