import DOMPurify from "isomorphic-dompurify";

/**
 * Strips HTML tags from text and returns plain text
 */
export function stripHtml(html: string): string {
    if (!html) return "";
    // Use DOMPurify to sanitize and strip all HTML tags
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
