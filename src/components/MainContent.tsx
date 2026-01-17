"use client";

import { usePlayerVisible } from "@/contexts/PlayerContext";

export function MainContent({ children }: { children: React.ReactNode }) {
    const isPlayerVisible = usePlayerVisible();

    return (
        <main
            className="flex-1 lg:ml-20 transition-[padding] duration-300"
            style={{
                paddingBottom: isPlayerVisible
                    ? 'calc(9rem + env(safe-area-inset-bottom, 0px))'
                    : 'calc(4rem + env(safe-area-inset-bottom, 0px))',
            }}
        >
            {children}
        </main>
    );
}
