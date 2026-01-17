"use client";

import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    hover?: boolean;
    interactive?: boolean;
}

export function Card(
    { children, hover = true, interactive = false, className = "", ...props }:
        CardProps,
) {
    const baseStyles =
        "bg-[#1f1f1f] rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-250 ease-in-out";
    const hoverStyles = hover
        ? "hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:border-[#FF3B30]"
        : "";
    const interactiveStyles = interactive
        ? "cursor-pointer active:scale-[0.98]"
        : "";
    const borderStyles = "border border-[#2a2a2a]";

    return (
        <div
            className={`${baseStyles} ${borderStyles} ${hoverStyles} ${interactiveStyles} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
