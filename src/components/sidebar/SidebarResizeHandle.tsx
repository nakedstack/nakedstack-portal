'use client';

import { useRef, useCallback } from 'react';
import { useNav } from '@/lib/nav-context';

const MIN_WIDTH = 180;
const MAX_WIDTH = 480;

export function SidebarResizeHandle() {
  const { setSidebarWidth } = useNav();
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    function onMouseMove(ev: MouseEvent) {
      if (!dragging.current) return;
      const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX));
      setSidebarWidth(clamped);
    }

    function onMouseUp() {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [setSidebarWidth]);

  return <div className="sidebar-resize-handle" onMouseDown={onMouseDown} aria-hidden />;
}
