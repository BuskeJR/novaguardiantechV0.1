import { cn } from '@/lib/utils';

export default function Textarea({ className, error, ...props }) {
  return (
    <textarea
      className={cn(
        'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        'text-sm resize-none',
        error && 'border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  );
}
