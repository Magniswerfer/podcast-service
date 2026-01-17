"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Podcast {
    id: string;
    title: string;
    description?: string;
    artworkUrl?: string;
    author?: string;
    episodeCount?: number;
}

export default function PodcastsPage() {
    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchPodcasts = async () => {
            try {
                const response = await fetch("/api/podcasts");
                if (!response.ok) {
                    if (response.status === 401) {
                        // Redirect to login if not authenticated
                        window.location.href = "/login";
                        return;
                    }
                    throw new Error("Failed to fetch podcasts");
                }
                const data = await response.json();
                setPodcasts(data.podcasts || []);
            } catch (error) {
                console.error("Error fetching podcasts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPodcasts();
    }, []);

    const filteredPodcasts = podcasts.filter((podcast) =>
        podcast.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-[#a0a0a0]">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">
                    My Podcasts
                </h1>
                <Link href="/discover">
                    <Button>Add Podcast</Button>
                </Link>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search podcasts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1f1f1f] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] transition-all duration-200"
                />
            </div>

            {/* Podcast Grid */}
            {filteredPodcasts.length === 0
                ? (
                    <div className="text-center py-12">
                        <p className="text-[#a0a0a0] mb-4">
                            {searchQuery
                                ? "No podcasts found"
                                : "No podcasts subscribed yet"}
                        </p>
                        <Link
                            href="/discover"
                            className="text-[#FF3B30] hover:text-[#FF5247] transition-colors"
                        >
                            Discover podcasts
                        </Link>
                    </div>
                )
                : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredPodcasts.map((podcast) => (
                            <Link
                                key={podcast.id}
                                href={`/podcasts/${podcast.id}`}
                            >
                                <Card interactive className="p-4">
                                    <img
                                        src={podcast.artworkUrl ||
                                            "/placeholder-artwork.png"}
                                        alt={podcast.title}
                                        className="w-full aspect-square rounded-[16px] object-cover mb-3"
                                    />
                                    <h3 className="font-semibold text-white truncate">
                                        {podcast.title}
                                    </h3>
                                    {podcast.author && (
                                        <p className="text-sm text-[#a0a0a0] truncate">
                                            {podcast.author}
                                        </p>
                                    )}
                                    {podcast.episodeCount !== undefined && (
                                        <p className="text-xs text-[#a0a0a0] mt-1">
                                            {podcast.episodeCount} episodes
                                        </p>
                                    )}
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
        </div>
    );
}
