'use client';

import { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  title = 'Confirm',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus Cancel button when modal opens (safer default)
    cancelButtonRef.current?.focus();

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <Card 
          className="w-full max-w-md p-6 relative pointer-events-auto"
        >
          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <h2 className="text-xl font-semibold text-white mb-4 pr-8">
            {title}
          </h2>

          <p className="text-[#e5e5e5] mb-6">
            {message}
          </p>

          <div className="flex space-x-3 justify-end">
            <Button
              ref={cancelButtonRef}
              variant="secondary"
              onClick={onCancel}
            >
              {cancelText}
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
