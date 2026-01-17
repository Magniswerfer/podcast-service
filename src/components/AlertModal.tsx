'use client';

import { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface AlertModalProps {
  message: string;
  onClose: () => void;
  title?: string;
}

export function AlertModal({ message, onClose, title = 'Alert' }: AlertModalProps) {
  const okButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus OK button when modal opens
    okButtonRef.current?.focus();

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <Card className="w-full max-w-md p-6 relative pointer-events-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
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

          <div className="flex justify-end">
            <Button
              ref={okButtonRef}
              variant="primary"
              onClick={onClose}
            >
              OK
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
