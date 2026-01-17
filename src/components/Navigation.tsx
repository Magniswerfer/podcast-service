"use client";

import Link from "next/link";

type NavigationItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    priority: number;
    isUserMenu?: boolean;
    onClick?: () => void;
};
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    ArrowRightOnRectangleIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    EllipsisHorizontalIcon,
    HomeIcon,
    MagnifyingGlassIcon,
    QueueListIcon,
    RadioIcon,
    UserIcon,
    ListBulletIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "./Tooltip";

// Base navigation items (most important first)
const baseNavigation: NavigationItem[] = [
    { name: "Dashboard", href: "/", icon: HomeIcon, priority: 1 },
    { name: "Podcasts", href: "/podcasts", icon: RadioIcon, priority: 2 },
    { name: "Queue", href: "/queue", icon: QueueListIcon, priority: 3 },
    { name: "Discover", href: "/discover", icon: MagnifyingGlassIcon, priority: 4 },
    { name: "Playlists", href: "/playlists", icon: ListBulletIcon, priority: 5 },
    { name: "Stats", href: "/stats", icon: ChartBarIcon, priority: 6 },
];

export function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [visibleItems, setVisibleItems] = useState<NavigationItem[]>([]);
    const [overflowItems, setOverflowItems] = useState<NavigationItem[]>([]);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    // Build navigation array including user menu items
    const getNavigationItems = () => {
        let navItems = [...baseNavigation];

        if (isAuthenticated) {
            navItems.push(
                { name: "Profile", href: "/profile", icon: Cog6ToothIcon, priority: 7, isUserMenu: true },
                { name: "Logout", href: "#", icon: ArrowRightOnRectangleIcon, priority: 8, isUserMenu: true, onClick: handleLogout }
            );
        } else {
            navItems.push(
                { name: "Login", href: "/login", icon: UserIcon, priority: 7, isUserMenu: true }
            );
        }

        return navItems;
    };

    // Handle overflow detection for mobile navigation
    useEffect(() => {
        const handleResize = () => {
            if (!navRef.current) return;

            const container = navRef.current;
            const containerWidth = container.offsetWidth;
            const itemWidth = 80; // Approximate width per item (including padding)
            const moreButtonWidth = 60; // Width of "More" button when needed

            const navigation = getNavigationItems();
            let maxVisibleItems = Math.floor(containerWidth / itemWidth);

            // If we need space for "More" button, reduce visible items
            const totalItems = navigation.length;
            if (totalItems > maxVisibleItems) {
                maxVisibleItems -= 1; // Reserve space for "More" button
            }

            const newVisibleItems = navigation.slice(0, maxVisibleItems);
            const newOverflowItems = navigation.slice(maxVisibleItems);

            setVisibleItems(newVisibleItems);
            setOverflowItems(newOverflowItems);
        };

        // Initial calculation
        handleResize();

        // Use ResizeObserver for responsive updates
        const resizeObserver = new ResizeObserver(handleResize);
        if (navRef.current) {
            resizeObserver.observe(navRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [isAuthenticated]); // Re-run when auth status changes

    const checkAuth = async () => {
        try {
            const response = await fetch("/api/podcasts");
            setIsAuthenticated(response.ok);
        } catch (error) {
            setIsAuthenticated(false);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/web/logout", { method: "POST" });
        setIsAuthenticated(false);
        router.push("/login");
        router.refresh();
    };

    // Don't show navigation on auth pages
    if (pathname === "/login" || pathname === "/register") {
        return null;
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className="hidden lg:flex fixed left-0 top-0 h-full w-20 flex-col items-center bg-[#1a1a1a] border-r border-[#2a2a2a] z-40"
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                }}
            >
                {/* Logo */}
                <div className="flex items-center justify-center h-20 w-full border-b border-[#2a2a2a]">
                    <Link
                        href="/"
                        className="text-2xl font-bold text-[#FF3B30]"
                    >
                        P
                    </Link>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 flex flex-col items-center py-6 space-y-4 w-full">
                    {baseNavigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Tooltip
                                key={item.name}
                                content={item.name}
                                position="right"
                            >
                                <Link
                                    href={item.href}
                                    className={`w-12 h-12 flex items-center justify-center rounded-[12px] transition-all duration-200 ${
                                        isActive
                                            ? "bg-[#FF3B30] text-white"
                                            : "text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f]"
                                    }`}
                                >
                                    <item.icon className="h-6 w-6" />
                                </Link>
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* User Menu */}
                <div className="w-full border-t border-[#2a2a2a] py-4 flex flex-col items-center space-y-2">
                    {isAuthenticated
                        ? (
                            <>
                                <Tooltip content="Profile" position="right">
                                    <Link
                                        href="/profile"
                                        className={`w-12 h-12 flex items-center justify-center rounded-[12px] transition-all duration-200 ${
                                            pathname === "/profile"
                                                ? "bg-[#FF3B30] text-white"
                                                : "text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f]"
                                        }`}
                                    >
                                        <Cog6ToothIcon className="h-6 w-6" />
                                    </Link>
                                </Tooltip>
                                <Tooltip content="Logout" position="right">
                                    <button
                                        onClick={handleLogout}
                                        className="w-12 h-12 flex items-center justify-center rounded-[12px] text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-all duration-200"
                                    >
                                        <ArrowRightOnRectangleIcon className="h-6 w-6" />
                                    </button>
                                </Tooltip>
                            </>
                        )
                        : (
                            <>
                                <Tooltip content="Login" position="right">
                                    <Link
                                        href="/login"
                                        className="w-12 h-12 flex items-center justify-center rounded-[12px] text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-all duration-200"
                                    >
                                        <UserIcon className="h-6 w-6" />
                                    </Link>
                                </Tooltip>
                            </>
                        )}
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav
                className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] z-50"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                <div
                    ref={navRef}
                    className="flex items-center h-16 px-2 relative"
                >
                    {/* Visible navigation items */}
                    {visibleItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center justify-center flex-1 h-full rounded-t-[12px] transition-all duration-200 min-w-0 ${
                                    isActive
                                        ? "text-[#FF3B30]"
                                        : "text-[#a0a0a0]"
                                }`}
                            >
                                <item.icon className="h-6 w-6 mb-1" />
                                <span
                                    className={`text-xs truncate ${
                                        isActive ? "font-medium" : ""
                                    }`}
                                >
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More menu button */}
                    {overflowItems.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                className={`flex flex-col items-center justify-center h-full px-3 rounded-t-[12px] transition-all duration-200 ${
                                    showMoreMenu
                                        ? "text-[#FF3B30]"
                                        : "text-[#a0a0a0]"
                                }`}
                            >
                                <EllipsisHorizontalIcon className="h-6 w-6 mb-1" />
                                <span className={`text-xs ${showMoreMenu ? "font-medium" : ""}`}>
                                    More
                                </span>
                            </button>

                            {/* More menu dropdown */}
                            {showMoreMenu && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[12px] shadow-xl z-50">
                                    {overflowItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        const handleItemClick = () => {
                                            setShowMoreMenu(false);
                                            if (item.onClick) {
                                                item.onClick();
                                            }
                                        };

                                        if (item.onClick || item.href === '#') {
                                            // Button for logout or other actions
                                            return (
                                                <button
                                                    key={item.name}
                                                    onClick={handleItemClick}
                                                    className={`flex items-center w-full px-4 py-3 text-sm text-left transition-colors duration-200 ${
                                                        isActive
                                                            ? "text-[#FF3B30] bg-[#2a2a2a]"
                                                            : "text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f]"
                                                    }`}
                                                >
                                                    <item.icon className="h-5 w-5 mr-3" />
                                                    {item.name}
                                                </button>
                                            );
                                        } else {
                                            // Link for navigation
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={handleItemClick}
                                                    className={`flex items-center px-4 py-3 text-sm transition-colors duration-200 ${
                                                        isActive
                                                            ? "text-[#FF3B30] bg-[#2a2a2a]"
                                                            : "text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f]"
                                                    }`}
                                                >
                                                    <item.icon className="h-5 w-5 mr-3" />
                                                    {item.name}
                                                </Link>
                                            );
                                        }
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Overlay to close more menu when clicking outside */}
                    {showMoreMenu && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMoreMenu(false)}
                        />
                    )}
                </div>
            </nav>
        </>
    );
}
