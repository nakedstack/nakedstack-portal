'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const DEFAULT_SIDEBAR_WIDTH = 240;

interface NavContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  expandedPageIds: Set<string>;
  toggleExpand: (id: string) => void;
  expandPath: (ids: string[]) => void;
}

const NavContext = createContext<NavContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  toggleSidebar: () => {},
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  setSidebarWidth: () => {},
  expandedPageIds: new Set(),
  toggleExpand: () => {},
  expandPath: () => {},
});

export function NavProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(new Set());

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedPageIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandPath = useCallback((ids: string[]) => {
    setExpandedPageIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  return (
    <NavContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar, sidebarWidth, setSidebarWidth, expandedPageIds, toggleExpand, expandPath }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  return useContext(NavContext);
}
