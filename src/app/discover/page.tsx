"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LinkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UrlModal } from "@/components/UrlModal";
import { AlertModal } from "@/components/AlertModal";

interface SearchResult {
    feedUrl: string;
    collectionName: string;
    artistName: string;
    artworkUrl100?: string;
    artworkUrl600?: string;
}

export default function DiscoverPage() {
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showUrlModal, setShowUrlModal] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // Check if user is authenticated
    useEffect(() => {
        checkAuth();
    }, []);

    // Focus search input when page loads
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const checkAuth = async () => {
        try {
            // Try to fetch user data - if session exists, this will work
            const response = await fetch("/api/podcasts");
            setIsAuthenticated(response.ok);
            if (!response.ok && response.status === 401) {
                router.push("/login");
            }
        } catch (error) {
            setIsAuthenticated(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(
                `/api/podcasts/search?q=${encodeURIComponent(searchQuery)}`,
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Search failed");
            }

            const data = await response.json();
            setSearchResults(data.results || []);
        } catch (error) {
            console.error("Search error:", error);
            setAlertMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to search podcasts",
            );
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribeByUrl = async (feedUrl: string) => {
        if (!feedUrl.trim()) return;

        try {
            const response = await fetch("/api/podcasts/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ feedUrl: feedUrl.trim() }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Subscribe failed");
            }

            setAlertMessage("Successfully subscribed!");
            setShowUrlModal(false);
            // Optionally redirect to podcasts page after a short delay
            setTimeout(() => {
                window.location.href = "/podcasts";
            }, 1500);
        } catch (error) {
            console.error("Subscribe error:", error);
            setAlertMessage(
                error instanceof Error ? error.message : "Failed to subscribe",
            );
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-white mb-8">
                Discover Podcasts
            </h1>

            {/* Search */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                    Search
                </h2>
                <div className="flex space-x-4 mb-6">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#a0a0a0]" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search for podcasts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === "Enter" && handleSearch()}
                            className="w-full pl-10 pr-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] transition-all duration-200"
                        />
                    </div>
                    <Button
                        variant="icon"
                        onClick={() => setShowUrlModal(true)}
                        className="flex-shrink-0"
                    >
                        <LinkIcon className="h-5 w-5" />
                    </Button>
                    <Button onClick={handleSearch} disabled={loading}>
                        {loading ? "Searching..." : "Search"}
                    </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.map((result, index) => (
                            <Card key={index} interactive className="p-4">
                                <img
                                    src={result.artworkUrl600 ||
                                        result.artworkUrl100 ||
                                        "/placeholder-artwork.png"}
                                    alt={result.collectionName}
                                    className="w-full aspect-square rounded-[16px] object-cover mb-3"
                                />
                                <h3 className="font-semibold text-white mb-1">
                                    {result.collectionName}
                                </h3>
                                <p className="text-sm text-[#a0a0a0] mb-3">
                                    {result.artistName}
                                </p>
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(
                                                "/api/podcasts/subscribe",
                                                {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type":
                                                            "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                        feedUrl: result.feedUrl,
                                                    }),
                                                },
                                            );

                                            if (!response.ok) {
                                                const error = await response
                                                    .json();
                                                throw new Error(
                                                    error.error ||
                                                        "Subscribe failed",
                                                );
                                            }

                                            setAlertMessage("Successfully subscribed!");
                                            setTimeout(() => {
                                                window.location.href = "/podcasts";
                                            }, 1500);
                                        } catch (error) {
                                            console.error(
                                                "Subscribe error:",
                                                error,
                                            );
                                            setAlertMessage(
                                                error instanceof Error
                                                    ? error.message
                                                    : "Failed to subscribe",
                                            );
                                        }
                                    }}
                                >
                                    Subscribe
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>

            {/* URL Modal */}
            {showUrlModal && (
                <UrlModal
                    onClose={() => setShowUrlModal(false)}
                    onSubmit={handleSubscribeByUrl}
                />
            )}

            {/* Alert Modal */}
            {alertMessage && (
                <AlertModal
                    message={alertMessage}
                    onClose={() => setAlertMessage(null)}
                    title={alertMessage.includes("Successfully") ? "Success" : "Error"}
                />
            )}
        </div>
    );
}
