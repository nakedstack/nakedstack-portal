'use client';

import { useCallback } from 'react';
import type { Block, BlockType } from '@/lib/types/pages';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockRow } from './BlockRow';
import type { BlockComponentProps } from '@/lib/types/pages';

interface SortableBlockProps extends Omit<React.ComponentProps<typeof BlockRow>, 'block'> {
  block: Block;
  readOnly?: boolean;
}

function SortableBlock({ block, ...rest }: SortableBlockProps) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Non spostiamo i listeners sull'intera riga — solo sull'handle
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <BlockRow
        block={block}
        {...rest}
        dragListeners={listeners}
        setDragActivatorRef={setActivatorNodeRef}
      />
    </div>
  );
}

interface Props {
  blocks: Block[];
  onUpdate: BlockComponentProps['onUpdate'];
  onDelete: BlockComponentProps['onDelete'];
  onInsertAfter: BlockComponentProps['onInsertAfter'];
  onConvertType: BlockComponentProps['onConvertType'];
  onReorder: (activeId: string, overId: string) => void;
  readOnly?: boolean;
}

export function BlockList({ blocks, onUpdate, onDelete, onInsertAfter, onConvertType, onReorder, readOnly }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  }, [onReorder]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div className="block-list">
          {blocks.map(block => (
            <SortableBlock
              key={block.id}
              block={block}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onInsertAfter={onInsertAfter}
              onConvertType={onConvertType}
              readOnly={readOnly}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
