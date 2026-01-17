'use client';

import { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface ShownotesProps {
  content: string;
  maxLength?: number;
}

export function Shownotes({ content, maxLength = 500 }: ShownotesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) {
    return <p className="text-gray-500 dark:text-gray-400">No shownotes available.</p>;
  }

  // Sanitize HTML content
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  // Check if content needs truncation (rough estimate)
  const textContent = content.replace(/<[^>]*>/g, '');
  const needsTruncation = textContent.length > maxLength;
  const displayContent = isExpanded || !needsTruncation
    ? sanitizedContent
    : sanitizedContent.substring(0, maxLength) + '...';

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <div
        dangerouslySetInnerHTML={{ __html: displayContent }}
        className="text-gray-700 dark:text-gray-300 leading-relaxed"
      />
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
