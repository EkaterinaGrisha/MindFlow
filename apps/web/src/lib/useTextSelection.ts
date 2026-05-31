import { useEffect, useState } from 'react';

export interface SelectionState {
  text: string;
  rect: DOMRect | null;
  isActive: boolean;
}

export function useTextSelection(containerRef: React.RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<SelectionState>({
    text: '',
    rect: null,
    isActive: false,
  });

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();

      if (!sel || sel.rangeCount === 0 || sel.toString().trim().length < 10) {
        setSelection({ text: '', rect: null, isActive: false });
        return;
      }

      const selectedText = sel.toString().trim();
      const range = sel.getRangeAt(0);

      // Проверяем что выделение внутри нашего контейнера
      if (
        containerRef.current &&
        !containerRef.current.contains(range.commonAncestorContainer)
      ) {
        setSelection({ text: '', rect: null, isActive: false });
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelection({ text: selectedText, rect, isActive: true });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [containerRef]);

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelection({ text: '', rect: null, isActive: false });
  };

  return { selection, clearSelection };
}
