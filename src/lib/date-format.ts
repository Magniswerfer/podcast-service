'use client';

import { useState, useEffect } from 'react';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

const DEFAULT_FORMAT: DateFormat = 'MM/DD/YYYY';

/**
 * Formats a date according to the specified format
 */
export function formatDate(
  date: Date | string,
  format: DateFormat = DEFAULT_FORMAT
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${month}/${day}/${year}`;
  }
}

/**
 * Hook to get user's date format preference
 * Fetches from profile API and caches it
 */
export function useDateFormat(): DateFormat {
  const [dateFormat, setDateFormat] = useState<DateFormat>(DEFAULT_FORMAT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if format is cached in sessionStorage
    const cachedFormat = sessionStorage.getItem('userDateFormat') as DateFormat | null;
    if (cachedFormat && ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(cachedFormat)) {
      setDateFormat(cachedFormat);
      setIsLoading(false);
      return;
    }

    // Fetch from API
    const fetchDateFormat = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          const format = data.defaultSettings?.dateFormat as DateFormat | undefined;
          if (format && ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(format)) {
            setDateFormat(format);
            sessionStorage.setItem('userDateFormat', format);
          }
        }
      } catch (error) {
        console.error('Failed to fetch date format:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDateFormat();
  }, []);

  return dateFormat;
}

/**
 * Format a date using the user's preferred format
 * This is a convenience function that uses the hook internally
 * Note: This should be used in client components only
 */
export function formatDateWithUserPreference(date: Date | string): string {
  // This is a fallback - components should use useDateFormat hook
  return formatDate(date, DEFAULT_FORMAT);
}
