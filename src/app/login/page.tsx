"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/web/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            // Redirect to dashboard
            router.push("/");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Sign in to Podcast Sync
                    </h2>
                    <p className="mt-2 text-center text-sm text-[#a0a0a0]">
                        Or{" "}
                        <Link
                            href="/register"
                            className="font-medium text-[#FF3B30] hover:text-[#FF5247] transition-colors"
                        >
                            create a new account
                        </Link>
                    </p>
                </div>
                <Card className="p-8">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-900/20 border border-red-800 rounded-[12px] p-4">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-[#e5e5e5] mb-2"
                                >
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20 transition-all duration-200"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-[#e5e5e5] mb-2"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20 transition-all duration-200"
                                    placeholder="Password (optional)"
                                />
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                disabled={loading}
                                variant="primary"
                                className="w-full"
                            >
                                {loading ? "Signing in..." : "Sign in"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
