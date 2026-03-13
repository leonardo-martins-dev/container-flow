import React, { useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { Plus, Trash2, Grid3X3, RotateCcw, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FactorySlot, Container } from '@/data/mockData';
import { ProcessIndicator } from './ProcessIndicator';

interface GridConfig {
  columns: number;
  rows: number;
  gap: number;
  cellWidth: number;
  cellHeight: number;
  autoResize: boolean;
}

interface FactoryGridProps {
  slots: FactorySlot[];
  containers: Container[];
  processes: any[];
  workers: any[];
  onSlotsChange: (slots: FactorySlot[]) => void;
  onContainerAssign: (containerId: number, slotId: string) => void;
  onContainerRemove: (containerId: number) => void;
  editMode: boolean;
  floorId: 1 | 2;
  draggedContainer?: number | null;
  className?: string;
}

const DEFAULT_CONFIG: GridConfig = {
  columns: 4,
  rows: 3,
  gap: 24,
  cellWidth: 240,
  cellHeight: 160,
  autoResize: true,
};

export const FactoryGrid: React.FC<FactoryGridProps> = ({
  slots,
  containers,
  processes,
  workers,
  onSlotsChange,
  onContainerAssign,
  onContainerRemove,
  editMode,
  floorId,
  draggedContainer: externalDraggedContainer,
  className,
}) => {
  const [config, setConfig] = useState<GridConfig>(DEFAULT_CONFIG);
  const [internalDraggedContainer, setInternalDraggedContainer] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Use external dragged container if available, otherwise use internal
  const draggedContainer = externalDraggedContainer ?? internalDraggedContainer;

  // Merge existing slots with default positions (only when x/y ainda não definidos)
  const gridSlots = useMemo(() => {
    if (slots.length > 0) {
      return slots.map((slot, index) => {
        const hasPosition = slot.x !== undefined && slot.y !== undefined;
        if (hasPosition) {
          return {
            ...slot,
            width: slot.width ?? config.cellWidth,
            height: slot.height ?? config.cellHeight,
          };
        }
        const col = index % config.columns;
        const row = Math.floor(index / config.columns);
        const topMargin = 32;
        const extraVerticalGap = 16;
        const x = col * (config.cellWidth + config.gap);
        const y = topMargin + row * (config.cellHeight + config.gap + extraVerticalGap);
        return {
          ...slot,
          x,
          y,
          width: config.cellWidth,
          height: config.cellHeight,
        };
      });
    }

    const initialSlots: FactorySlot[] = [];
    const topMargin = 32;
    const extraVerticalGap = 16;
    let index = 0;
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.columns; col++) {
        const x = col * (config.cellWidth + config.gap);
        const y = topMargin + row * (config.cellHeight + config.gap + extraVerticalGap);
        const id = `${floorId}-${row}-${col}`;
        initialSlots.push({
          id,
          name: `${floorId === 1 ? 'V' : 'A'}-${String(index + 1).padStart(2, '0')}`,
          x,
          y,
          width: config.cellWidth,
          height: config.cellHeight,
          containerId: null,
        } as FactorySlot);
        index++;
      }
    }
    return initialSlots;
  }, [slots, config, floorId]);

  // Update slots when grid changes
  React.useEffect(() => {
    if (gridSlots.length !== slots.length || 
        gridSlots.some((slot, i) => slots[i]?.id !== slot.id)) {
      onSlotsChange(gridSlots);
    }
  }, [gridSlots, slots, onSlotsChange]);

  const handleConfigChange = useCallback((newConfig: Partial<GridConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const handleContainerDragStart = useCallback((containerId: number) => {
    setInternalDraggedContainer(containerId);
  }, []);

  const handleContainerDragEnd = useCallback(() => {
    setInternalDraggedContainer(null);
    setDragOverSlot(null);
  }, []);

  const handleSlotDragOver = useCallback((e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setDragOverSlot(slotId);
  }, []);

  const handleSlotDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  const handleSlotDrop = useCallback((e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get container ID from drag data or current dragged container
    const dragData = e.dataTransfer.getData('text/plain');
    const containerId = dragData ? parseInt(dragData) : draggedContainer;
    
    if (containerId !== null && !isNaN(containerId)) {
      onContainerAssign(containerId, slotId);
    }
    
    handleContainerDragEnd();
    setDragOverSlot(null);
  }, [draggedContainer, onContainerAssign, handleContainerDragEnd]);

  const handleAddRow = useCallback(() => {
    handleConfigChange({ rows: config.rows + 1 });
  }, [config.rows, handleConfigChange]);

  const handleAddColumn = useCallback(() => {
    handleConfigChange({ columns: config.columns + 1 });
  }, [config.columns, handleConfigChange]);

  const handleRemoveRow = useCallback(() => {
    if (config.rows > 1) {
      handleConfigChange({ rows: config.rows - 1 });
    }
  }, [config.rows, handleConfigChange]);

  const handleRemoveColumn = useCallback(() => {
    if (config.columns > 1) {
      handleConfigChange({ columns: config.columns - 1 });
    }
  }, [config.columns, handleConfigChange]);

  const handleClearAll = useCallback(() => {
    const clearedSlots = gridSlots.map(slot => ({ ...slot, containerId: null }));
    onSlotsChange(clearedSlots);
  }, [gridSlots, onSlotsChange]);

  const getContainerById = useCallback((id: number | null) => {
    if (!id) return null;
    return containers.find(c => c.id === id);
  }, [containers]);

  const gridWidth = Math.max(
    config.columns * config.cellWidth + (config.columns - 1) * config.gap,
    ...gridSlots.map((s) => (s.x || 0) + (s.width || config.cellWidth) + config.gap)
  );
  const gridHeight =
    Math.max(
      config.rows * config.cellHeight + (config.rows - 1) * config.gap + 100,
      ...gridSlots.map((s) => (s.y || 0) + (s.height || config.cellHeight) + 100)
    );

  const gridRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grid Controls */}
      {editMode && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Grid3X3 className="w-3 h-3" />
                {config.columns} × {config.rows}
              </Badge>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveColumn}
                  disabled={config.columns <= 1}
                >
                  Col -
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddColumn}
                >
                  Col +
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveRow}
                  disabled={config.rows <= 1}
                >
                  Row -
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                >
                  Row +
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar Tudo
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Factory Grid */}
      <div className="w-full">
        <div
          className="relative w-full"
          ref={gridRef}
          style={{
            minHeight: gridHeight,
            width: '100%'
          }}
        >
          <AnimatePresence>
            {gridSlots.map((slot) => {
              const container = getContainerById(slot.containerId);
              const isDropTarget = dragOverSlot === slot.id && !slot.containerId && draggedContainer !== null;
              
              return (
                <DraggableSlot
                  key={slot.id}
                  slot={slot}
                  editMode={editMode}
                  gridHeight={gridHeight}
                  gridRef={gridRef}
                  isDropTarget={isDropTarget}
                  hasContainer={!!container}
                  onPositionChange={(slotId, newX, newY) => {
                    const nextSlots = slots.map((s) =>
                      s.id === slotId ? { ...s, x: newX, y: newY } : s
                    );
                    onSlotsChange(nextSlots);
                  }}
                  onSlotDragOver={handleSlotDragOver}
                  onSlotDragLeave={handleSlotDragLeave}
                  onSlotDrop={handleSlotDrop}
                >
                  <div className="absolute -top-8 left-0 text-xs font-medium text-muted-foreground bg-background px-1 rounded">
                    {slot.name}
                  </div>

                  {container ? (
                    <ContainerCard
                      container={container}
                      processes={processes}
                      workers={workers}
                      onRemove={() => onContainerRemove(container.id)}
                      onDragStart={() => handleContainerDragStart(container.id)}
                      onDragEnd={handleContainerDragEnd}
                      isDragging={draggedContainer === container.id}
                      editMode={editMode}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      {isDropTarget ? (
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1.1 }}
                          className="text-accent font-medium text-sm"
                        >
                          Soltar aqui
                        </motion.div>
                      ) : (
                        <Plus className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>
                  )}
                </DraggableSlot>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

interface DraggableSlotProps {
  slot: FactorySlot & { width: number; height: number };
  editMode: boolean;
  gridHeight: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  isDropTarget: boolean;
  hasContainer: boolean;
  onPositionChange: (slotId: string, newX: number, newY: number) => void;
  onSlotDragOver: (e: React.DragEvent, slotId: string) => void;
  onSlotDragLeave: () => void;
  onSlotDrop: (e: React.DragEvent, slotId: string) => void;
  children: React.ReactNode;
}

const DraggableSlot: React.FC<DraggableSlotProps> = ({
  slot,
  editMode,
  gridHeight,
  gridRef,
  isDropTarget,
  hasContainer,
  onPositionChange,
  onSlotDragOver,
  onSlotDragLeave,
  onSlotDrop,
  children,
}) => {
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const prevPos = useRef({ x: slot.x, y: slot.y });

  useLayoutEffect(() => {
    if (slot.x !== prevPos.current.x || slot.y !== prevPos.current.y) {
      motionX.set(0);
      motionY.set(0);
      prevPos.current = { x: slot.x, y: slot.y };
    }
  }, [slot.x, slot.y, motionX, motionY]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        'absolute rounded-lg border-2 transition-colors duration-200',
        hasContainer
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-dashed border-muted-foreground/30 bg-muted/10',
        isDropTarget && 'border-accent bg-accent/20 scale-105 shadow-lg',
        editMode && 'hover:border-primary/50 cursor-grab active:cursor-grabbing'
      )}
      style={{
        left: slot.x,
        top: slot.y,
        width: slot.width,
        height: slot.height,
        x: motionX,
        y: motionY,
      }}
      drag={editMode}
      dragMomentum={false}
      onDragEnd={() => {
        if (!editMode || !gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        let newX = (slot.x ?? 0) + motionX.get();
        let newY = (slot.y ?? 0) + motionY.get();
        const maxX = Math.max(0, rect.width - slot.width);
        const maxY = Math.max(0, gridHeight - slot.height);
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        onPositionChange(slot.id, newX, newY);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSlotDragOver(e, slot.id);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSlotDragLeave();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSlotDrop(e, slot.id);
      }}
    >
      {children}
    </motion.div>
  );
};

interface ContainerCardProps {
  container: Container;
  processes: any[];
  workers: any[];
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  editMode: boolean;
}

const ContainerCard: React.FC<ContainerCardProps> = ({
  container,
  processes,
  workers,
  onRemove,
  onDragStart,
  onDragEnd,
  isDragging,
  editMode,
}) => {
  // Calculate progress
  const completedStages = container.processStages.filter(s => s.status === 'completed').length;
  const totalStages = container.processStages.length;
  const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  // Get active process
  const activeStage = container.processStages.find(s => s.status === 'in_progress');
  
  // Calculate days remaining
  const daysRemaining = Math.ceil(
    (new Date(container.deliveryDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getDeadlineColor = () => {
    if (daysRemaining < 0) return 'text-destructive';
    if (daysRemaining <= 2) return 'text-destructive';
    if (daysRemaining <= 5) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div
      draggable={!editMode}
      onDragStart={(e: React.DragEvent) => {
        if (!editMode) {
          onDragStart();
          e.dataTransfer.setData('text/plain', container.id.toString());
          e.dataTransfer.effectAllowed = 'move';
        }
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'h-full w-full p-2 flex flex-col relative overflow-hidden',
        !editMode && 'cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      {/* Remove Button - positioned to not overlap content */}
      {!editMode && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-0.5 right-0.5 w-5 h-5 p-0 opacity-60 hover:opacity-100 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="w-2.5 h-2.5" />
        </Button>
      )}

      {/* Header - compact */}
      <div className="flex items-start justify-between mb-1.5 pr-6">
        <div className="min-w-0 flex-1 overflow-hidden">
          <h3 className="font-bold text-xs truncate leading-tight">{container.number}</h3>
          <p className="text-xs text-muted-foreground truncate leading-tight">{container.type}</p>
          <p className="text-xs text-muted-foreground truncate leading-tight">{container.cliente}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 leading-none">
            {progress}%
          </Badge>
          <span className={cn('text-xs font-medium leading-none', getDeadlineColor())}>
            {daysRemaining}d
          </span>
        </div>
      </div>

      {/* Active Process - compact and contained */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full">
          <ProcessIndicator
            container={container}
            processes={processes}
            workers={workers}
            className="text-xs h-full"
          />
        </div>
      </div>
    </div>
  );
};