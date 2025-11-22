import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

export function Dialog({ open, onClose, children, className }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div
          className={cn(
            'relative bg-white rounded-lg shadow-xl max-w-lg w-full',
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }) {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, onClose, className }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
        {children}
      </h3>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function DialogContent({ children, className }) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function DialogFooter({ children, className }) {
  return (
    <div className={cn('px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 rounded-b-lg', className)}>
      {children}
    </div>
  );
}
