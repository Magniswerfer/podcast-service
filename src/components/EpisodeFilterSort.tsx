"use client";

import { useState } from "react";
import { 
    FunnelIcon, 
    ChevronDownIcon, 
    ChevronUpIcon,
    EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { PodcastFilterSettings } from "@/types/index";
import { SaveFilterModal } from "./SaveFilterModal";

type FilterOption = 'all' | 'unplayed' | 'uncompleted' | 'in-progress';
type SortOption = 'newest' | 'oldest';

interface EpisodeFilterSortProps {
    podcastId: string;
    savedSettings?: PodcastFilterSettings;
    onFilterChange: (filter: FilterOption, sort: SortOption) => void;
    onSavePreferences?: (settings: PodcastFilterSettings) => Promise<void>;
}

export function EpisodeFilterSort({
    podcastId,
    savedSettings,
    onFilterChange,
    onSavePreferences,
}: EpisodeFilterSortProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filter, setFilter] = useState<FilterOption>(savedSettings?.episodeFilter || 'all');
    const [sort, setSort] = useState<SortOption>(savedSettings?.episodeSort || 'newest');
    const [applying, setApplying] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Check if any non-default filter is active
    const hasActiveFilter = filter !== 'all' || sort !== 'newest';

    const handleApply = async () => {
        setApplying(true);
        try {
            await onFilterChange(filter, sort);
            setIsExpanded(false);
        } catch (error) {
            console.error('Failed to apply filter:', error);
        } finally {
            setApplying(false);
        }
    };

    const handleSavePreferences = async (settings: PodcastFilterSettings) => {
        if (!onSavePreferences) return;
        
        try {
            await onSavePreferences(settings);
            setShowSaveModal(false);
        } catch (error) {
            console.error('Failed to save preferences:', error);
            throw error;
        }
    };

    const filterLabels: Record<FilterOption, string> = {
        'all': 'All',
        'unplayed': 'Unplayed',
        'uncompleted': 'Uncompleted',
        'in-progress': 'In Progress',
    };

    const sortLabels: Record<SortOption, string> = {
        'newest': 'Newest',
        'oldest': 'Oldest',
    };

    return (
        <div className="mb-6">
            {/* Collapsed State - Filter Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-medium transition-all duration-200
                    ${hasActiveFilter 
                        ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30 hover:bg-[#FF3B30]/20' 
                        : 'bg-[#1f1f1f] text-[#a0a0a0] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:text-white'
                    }
                `}
            >
                <FunnelIcon className="w-4 h-4" />
                <span>
                    {hasActiveFilter 
                        ? `${filterLabels[filter]} · ${sortLabels[sort]}`
                        : 'Filter & Sort'
                    }
                </span>
                {isExpanded ? (
                    <ChevronUpIcon className="w-4 h-4 ml-1" />
                ) : (
                    <ChevronDownIcon className="w-4 h-4 ml-1" />
                )}
            </button>

            {/* Expanded State - Filter Options */}
            {isExpanded && (
                <div className="mt-3 p-4 bg-[#1f1f1f] rounded-[16px] border border-[#2a2a2a] animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                        {/* Filter Dropdown */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                                Filter
                            </label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as FilterOption)}
                                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-[12px] text-white text-sm focus:outline-none focus:border-[#FF3B30] transition-colors"
                            >
                                <option value="all">All Episodes</option>
                                <option value="unplayed">Unplayed</option>
                                <option value="uncompleted">Uncompleted</option>
                                <option value="in-progress">In Progress</option>
                            </select>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                                Sort
                            </label>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortOption)}
                                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-[12px] text-white text-sm focus:outline-none focus:border-[#FF3B30] transition-colors"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full sm:w-auto">
                            {onSavePreferences && (
                                <button
                                    onClick={() => setShowSaveModal(true)}
                                    disabled={applying}
                                    className="px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-[12px] text-[#a0a0a0] hover:text-white hover:border-[#4a4a4a] transition-colors disabled:opacity-50"
                                    title="Set default filter"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={handleApply}
                                disabled={applying}
                                className="px-4 py-2 bg-[#FF3B30] rounded-[12px] text-white text-sm font-medium hover:bg-[#FF3B30]/90 transition-colors disabled:opacity-50"
                            >
                                {applying ? "Applying..." : "Apply"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Modal */}
            {showSaveModal && (
                <SaveFilterModal
                    currentSettings={savedSettings}
                    onSave={handleSavePreferences}
                    onCancel={() => setShowSaveModal(false)}
                />
            )}
        </div>
    );
}
