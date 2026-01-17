"use client";

import { usePlayerVisible } from "@/contexts/PlayerContext";

export function MainContent({ children }: { children: React.ReactNode }) {
    const isPlayerVisible = usePlayerVisible();

    return (
        <main
            className={`flex-1 lg:ml-20 transition-[padding] duration-300 ${
                isPlayerVisible
                    ? "pb-32 sm:pb-36 lg:pb-28"
                    : "pb-16 lg:pb-24"
            }`}
        >
            {children}
        </main>
    );
}
