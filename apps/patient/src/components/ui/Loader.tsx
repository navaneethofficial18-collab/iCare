import React from 'react';

export default function Loader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return (
    <div className="flex justify-center items-center p-4">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary ${dims}`}></div>
    </div>
  );
}
