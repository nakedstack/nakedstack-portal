'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface ContextMenuProps {
  children: ReactNode;
  items: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    danger?: boolean;
  }[];
}

export default function ContextMenu({ children, items }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="ctx-menu-wrapper">
      <button
        ref={triggerRef}
        className="ctx-menu-trigger"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(!open);
        }}
        aria-label="Menu contestuale"
      >
        {children}
      </button>
      {open && (
        <div ref={menuRef} className="ctx-menu">
          {items.map((item, i) => (
            <button
              key={i}
              className={`ctx-menu__item${item.danger ? ' ctx-menu__item--danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
            >
              {item.icon && <span className="ctx-menu__icon">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
