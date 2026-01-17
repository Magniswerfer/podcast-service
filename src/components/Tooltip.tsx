"use client";

import { useEffect, useRef, useState } from "react";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
}

export function Tooltip(
    { content, children, position = "top", delay = 200 }: TooltipProps,
) {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const showTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current && tooltipRef.current) {
                const triggerRect = triggerRef.current.getBoundingClientRect();
                const tooltipRect = tooltipRef.current.getBoundingClientRect();

                let top = 0;
                let left = 0;

                switch (position) {
                    case "top":
                        top = triggerRect.top - tooltipRect.height - 8;
                        left = triggerRect.left + (triggerRect.width / 2) -
                            (tooltipRect.width / 2);
                        break;
                    case "bottom":
                        top = triggerRect.bottom + 8;
                        left = triggerRect.left + (triggerRect.width / 2) -
                            (tooltipRect.width / 2);
                        break;
                    case "left":
                        top = triggerRect.top + (triggerRect.height / 2) -
                            (tooltipRect.height / 2);
                        left = triggerRect.left - tooltipRect.width - 8;
                        break;
                    case "right":
                        top = triggerRect.top + (triggerRect.height / 2) -
                            (tooltipRect.height / 2);
                        left = triggerRect.right + 8;
                        break;
                }

                // Keep tooltip within viewport
                const padding = 8;
                if (left < padding) left = padding;
                if (left + tooltipRect.width > window.innerWidth - padding) {
                    left = window.innerWidth - tooltipRect.width - padding;
                }
                if (top < padding) top = padding;
                if (top + tooltipRect.height > window.innerHeight - padding) {
                    top = window.innerHeight - tooltipRect.height - padding;
                }

                setTooltipPosition({ top, left });
                setIsVisible(true);
            }
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                className="inline-block"
            >
                {children}
            </div>
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className="fixed z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none border border-gray-700"
                    style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                        opacity: isVisible ? 1 : 0,
                        transition: "opacity 150ms ease-in-out",
                    }}
                >
                    {content}
                    <div
                        className={`absolute w-2 h-2 bg-gray-900 border-gray-700 ${
                            position === "top"
                                ? "bottom-[-4px] left-1/2 -translate-x-1/2 rotate-45 border-r border-b"
                                : position === "bottom"
                                ? "top-[-4px] left-1/2 -translate-x-1/2 rotate-45 border-l border-t"
                                : position === "left"
                                ? "right-[-4px] top-1/2 -translate-y-1/2 rotate-45 border-r border-t"
                                : "left-[-4px] top-1/2 -translate-y-1/2 rotate-45 border-l border-b"
                        }`}
                    />
                </div>
            )}
        </>
    );
}
