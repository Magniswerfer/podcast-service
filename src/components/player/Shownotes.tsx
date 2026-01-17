"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";

interface ShownotesProps {
    content: string;
    maxLength?: number;
}

// Convert plain text URLs to clickable links (avoiding already-linked URLs)
function linkifyText(text: string): string {
    // Match URLs that are not already inside an href attribute or anchor tag
    // This regex matches URLs not preceded by href=" or >
    const urlRegex = /(?<!href=["']|>)(https?:\/\/[^\s<>"']+)/g;
    return text.replace(
        urlRegex,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

export function Shownotes({ content, maxLength = 500 }: ShownotesProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!content) {
        return <p className="text-[#a0a0a0]">No shownotes available.</p>;
    }

    // First linkify plain URLs, then sanitize HTML content
    const linkedContent = linkifyText(content);
    const sanitizedContent = DOMPurify.sanitize(linkedContent, {
        ALLOWED_TAGS: [
            "p",
            "br",
            "strong",
            "em",
            "u",
            "a",
            "ul",
            "ol",
            "li",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "blockquote",
            "code",
            "pre",
        ],
        ALLOWED_ATTR: ["href", "target", "rel"],
    });

    // Check if content needs truncation (rough estimate)
    const textContent = content.replace(/<[^>]*>/g, "");
    const needsTruncation = textContent.length > maxLength;
    const displayContent = isExpanded || !needsTruncation
        ? sanitizedContent
        : sanitizedContent.substring(0, maxLength) + "...";

    return (
        <div className="prose prose-invert max-w-none">
            <div
                dangerouslySetInnerHTML={{ __html: displayContent }}
                className="shownotes-content text-[#e5e5e5] leading-relaxed prose-headings:text-white prose-strong:text-white prose-code:text-[#FF3B30] prose-code:bg-[#252525] prose-code:px-1 prose-code:py-0.5 prose-code:rounded break-words"
                style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                }}
            />
            {needsTruncation && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-4 text-[#FF3B30] hover:text-[#FF5247] font-medium transition-colors"
                >
                    {isExpanded ? "Show less" : "Show more"}
                </button>
            )}
        </div>
    );
}
