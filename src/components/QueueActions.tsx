"use client";

import { useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { Tooltip } from "./Tooltip";
import { PlusIcon, QueueListIcon } from "@heroicons/react/24/outline";
import { Button } from "./ui/Button";

interface QueueActionsProps {
    episodeId: string;
    onSuccess?: () => void;
}

export function QueueActions({ episodeId, onSuccess }: QueueActionsProps) {
    const { addToQueue, playNext } = usePlayer();
    const [addingToQueue, setAddingToQueue] = useState(false);
    const [addingToPlayNext, setAddingToPlayNext] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddToQueue = async () => {
        setAddingToQueue(true);
        setError(null);
        try {
            await addToQueue(episodeId);
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || "Failed to add to queue");
        } finally {
            setAddingToQueue(false);
        }
    };

    const handlePlayNext = async () => {
        setAddingToPlayNext(true);
        setError(null);
        try {
            await playNext(episodeId);
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || "Failed to add to play next");
        } finally {
            setAddingToPlayNext(false);
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex space-x-2 w-full">
                <Tooltip content="Add to Queue" position="top">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddToQueue}
                        disabled={addingToQueue || addingToPlayNext}
                        className="flex-1"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        {addingToQueue ? "Adding..." : "Queue"}
                    </Button>
                </Tooltip>
                <Tooltip content="Play Next" position="top">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePlayNext}
                        disabled={addingToQueue || addingToPlayNext}
                        className="flex-1"
                    >
                        <QueueListIcon className="h-4 w-4 mr-1" />
                        {addingToPlayNext ? "Adding..." : "Next"}
                    </Button>
                </Tooltip>
            </div>
            {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
        </div>
    );
}
