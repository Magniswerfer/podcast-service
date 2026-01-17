"use client";

import { usePlayer } from "@/contexts/PlayerContext";

export function MainContent({ children }: { children: React.ReactNode }) {
    const { currentEpisode, isMinimized } = usePlayer();
    const isPlayerVisible = currentEpisode !== null;

    // Calculate padding based on player state
    const getPadding = () => {
        if (!isPlayerVisible) {
            return 'calc(4rem + env(safe-area-inset-bottom, 0px))';
        }
        if (isMinimized) {
            return 'calc(7rem + env(safe-area-inset-bottom, 0px))'; // Less padding when minimized
        }
        return 'calc(9rem + env(safe-area-inset-bottom, 0px))'; // Full padding when maximized
    };

    return (
        <main
            className="flex-1 lg:ml-20 transition-[padding] duration-300"
            style={{
                paddingBottom: getPadding(),
            }}
        >
            {children}
        </main>
    );
}
