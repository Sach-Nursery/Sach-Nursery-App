import { useEffect } from 'react';

export function useEscapeKey(isActive, onEscape) {
  useEffect(() => {
    if (!isActive || typeof onEscape !== 'function') return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
}
