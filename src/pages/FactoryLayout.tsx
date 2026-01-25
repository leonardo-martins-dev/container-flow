import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Grid,
  Plus,
  Trash2,
  Move,
  Container as ContainerIcon,
  Clock,
  User,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContainerContext } from '@/contexts/ContainerContext';
import { getWorkerColor, FactorySlot, Container } from '@/data/mockData';
import {
  calculateProgress,
  calculateDaysRemaining,
  getDeadlineStatus,
  getRemainingTime,
  getElapsedPercentage,
  cn,
} from '@/lib/utils';

const FactoryLayout: React.FC = () => {
  const {
    containers,
    processes,
    workers,
    factorySlots,
    factorySlots2,
    updateFactorySlots,
    updateFactorySlots2,
    assignContainerToSlot,
    removeContainerFromSlot,
  } = useContainerContext();

  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('factoryLayoutZoom');
    return saved ? parseFloat(saved) : 1;
  });
  const [showGrid, setShowGrid] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [draggedContainer, setDraggedContainer] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSlots = activeFloor === 1 ? factorySlots : factorySlots2;
  const setCurrentSlots = activeFloor === 1 ? updateFactorySlots : updateFactorySlots2;

  // Fixed slot dimensions for better visibility
  const slotWidth = 220;
  const slotHeight = 140;

  // Update every second for timers
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Save zoom to localStorage
  useEffect(() => {
    localStorage.setItem('factoryLayoutZoom', zoom.toString());
  }, [zoom]);

  // Containers without slots
  const unassignedContainers = containers.filter(c => {
    const inSlot1 = factorySlots.some(s => s.containerId === c.id);
    const inSlot2 = factorySlots2.some(s => s.containerId === c.id);
    return !inSlot1 && !inSlot2;
  });

  // Add slot at clicked position
  const handleAddSlotAtPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(20, (e.clientX - rect.left) / zoom - slotWidth / 2);
    const y = Math.max(30, (e.clientY - rect.top) / zoom - slotHeight / 2);

    const newSlot: FactorySlot = {
      id: `slot-${activeFloor}-${Date.now()}`,
      name: `${activeFloor === 1 ? 'V' : 'A'}-${String(currentSlots.length + 1).padStart(2, '0')}`,
      x,
      y,
      width: slotWidth,
      height: slotHeight,
      containerId: null,
    };

    setCurrentSlots([...currentSlots, newSlot]);
  };

  // Add slot with auto-positioning (button click)
  const handleAddSlotButton = () => {
    const gapX = 40;
    const gapY = 50;
    const startX = 40;
    const startY = 50;
    const cols = 3;
    
    const index = currentSlots.length;
    const x = startX + (index % cols) * (slotWidth + gapX);
    const y = startY + Math.floor(index / cols) * (slotHeight + gapY);

    const newSlot: FactorySlot = {
      id: `slot-${activeFloor}-${Date.now()}`,
      name: `${activeFloor === 1 ? 'V' : 'A'}-${String(currentSlots.length + 1).padStart(2, '0')}`,
      x,
      y,
      width: slotWidth,
      height: slotHeight,
      containerId: null,
    };

    setCurrentSlots([...currentSlots, newSlot]);
  };

  const handleDeleteSlot = (slotId: string) => {
    setCurrentSlots(currentSlots.filter(s => s.id !== slotId));
  };

  const handleContainerDragStart = (containerId: number) => {
    setDraggedContainer(containerId);
  };

  const handleSlotDrop = (slotId: string) => {
    if (draggedContainer !== null) {
      assignContainerToSlot(draggedContainer, slotId, activeFloor);
      setDraggedContainer(null);
    }
  };

  const handleClearFloor = () => {
    setCurrentSlots(currentSlots.map(s => ({ ...s, containerId: null })));
  };

  const getContainerData = (containerId: number | null) => {
    if (!containerId) return null;
    return containers.find(c => c.id === containerId);
  };

  const getActiveProcess = (container: Container) => {
    const activeStage = container.processStages.find(s => s.status === 'in_progress');
    if (!activeStage) return null;
    const process = processes.find(p => p.id === activeStage.processId);
    const worker = workers.find(w => activeStage.assignedWorkerIds.includes(w.id));
    return { stage: activeStage, process, worker };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Planta da Fábrica</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a disposição dos containers na fábrica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className={editMode ? 'gradient-primary text-primary-foreground' : ''}
          >
            <Move className="w-4 h-4 mr-2" />
            {editMode ? 'Editando' : 'Editar'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
            <Grid className={cn('w-4 h-4', showGrid && 'text-primary')} />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Factory Floor */}
        <div className="flex-1">
          <Tabs value={activeFloor.toString()} onValueChange={(v) => setActiveFloor(Number(v) as 1 | 2)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="glass">
                <TabsTrigger value="1">Terreno 1</TabsTrigger>
                <TabsTrigger value="2">Terreno 2</TabsTrigger>
              </TabsList>
              {editMode && (
                <div className="flex gap-2">
                  <Button variant="default" size="sm" onClick={handleAddSlotButton} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Vaga
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearFloor}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="1" className="mt-0">
              <FactoryFloor
                slots={factorySlots}
                zoom={zoom}
                showGrid={showGrid}
                editMode={editMode}
                draggedContainer={draggedContainer}
                onAddSlot={handleAddSlotAtPosition}
                onDeleteSlot={handleDeleteSlot}
                onSlotDrop={handleSlotDrop}
                getContainerData={getContainerData}
                getActiveProcess={getActiveProcess}
                processes={processes}
                removeContainerFromSlot={removeContainerFromSlot}
                slotWidth={slotWidth}
                slotHeight={slotHeight}
              />
            </TabsContent>

            <TabsContent value="2" className="mt-0">
              <FactoryFloor
                slots={factorySlots2}
                zoom={zoom}
                showGrid={showGrid}
                editMode={editMode}
                draggedContainer={draggedContainer}
                onAddSlot={handleAddSlotAtPosition}
                onDeleteSlot={handleDeleteSlot}
                onSlotDrop={handleSlotDrop}
                getContainerData={getContainerData}
                getActiveProcess={getActiveProcess}
                processes={processes}
                removeContainerFromSlot={removeContainerFromSlot}
                slotWidth={slotWidth}
                slotHeight={slotHeight}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Unassigned Containers Panel */}
        <Card className="w-80 glass flex-shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ContainerIcon className="w-4 h-4 text-primary" />
              Containers Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {unassignedContainers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Todos os containers estão alocados
                  </p>
                ) : (
                  unassignedContainers.map((container) => {
                    const progress = calculateProgress(container.processStages);
                    const deadlineStatus = getDeadlineStatus(container.deliveryDeadline);

                    return (
                      <motion.div
                        key={container.id}
                        draggable
                        onDragStart={() => handleContainerDragStart(container.id)}
                        onDragEnd={() => setDraggedContainer(null)}
                        className={cn(
                          'p-3 rounded-lg border cursor-grab active:cursor-grabbing',
                          'bg-card hover:border-primary/30 transition-all',
                          draggedContainer === container.id && 'opacity-50'
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">{container.number}</p>
                            <p className="text-xs text-muted-foreground">{container.type}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              deadlineStatus === 'overdue' && 'border-destructive text-destructive',
                              deadlineStatus === 'urgent' && 'border-destructive text-destructive',
                              deadlineStatus === 'warning' && 'border-warning text-warning',
                            )}
                          >
                            {calculateDaysRemaining(container.deliveryDeadline)}d
                          </Badge>
                        </div>
                        <Progress value={progress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">{progress}% completo</p>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface FactoryFloorProps {
  slots: FactorySlot[];
  zoom: number;
  showGrid: boolean;
  editMode: boolean;
  draggedContainer: number | null;
  onAddSlot: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDeleteSlot: (slotId: string) => void;
  onSlotDrop: (slotId: string) => void;
  getContainerData: (containerId: number | null) => Container | null | undefined;
  getActiveProcess: (container: Container) => { stage: any; process: any; worker: any } | null;
  processes: any[];
  removeContainerFromSlot: (containerId: number) => void;
  slotWidth: number;
  slotHeight: number;
}

const FactoryFloor: React.FC<FactoryFloorProps> = ({
  slots,
  zoom,
  showGrid,
  editMode,
  draggedContainer,
  onAddSlot,
  onDeleteSlot,
  onSlotDrop,
  getContainerData,
  getActiveProcess,
  processes,
  removeContainerFromSlot,
  slotWidth,
  slotHeight,
}) => {
  return (
    <Card className="glass overflow-hidden">
      <div
        className={cn(
          'relative w-full h-[600px] overflow-auto cursor-crosshair',
          showGrid && 'bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]',
          showGrid && 'bg-[size:20px_20px]',
          !editMode && 'cursor-default'
        )}
        onClick={editMode ? onAddSlot : undefined}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
          }}
        >
          {slots.map((slot) => {
            const container = getContainerData(slot.containerId);
            const activeProcess = container ? getActiveProcess(container) : null;
            const progress = container ? calculateProgress(container.processStages) : 0;

            return (
              <motion.div
                key={slot.id}
                className={cn(
                  'absolute rounded-lg border-2 border-dashed transition-all',
                  slot.containerId
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50 bg-muted/20',
                  draggedContainer && !slot.containerId && 'border-accent bg-accent/10'
                )}
                style={{
                  left: slot.x,
                  top: slot.y,
                  width: slotWidth,
                  height: slotHeight,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!slot.containerId) {
                    onSlotDrop(slot.id);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Slot Label */}
                <div className="absolute -top-6 left-0 text-xs font-medium text-muted-foreground">
                  {slot.name}
                </div>

                {/* Delete button in edit mode */}
                {editMode && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-5 h-5 z-10"
                    onClick={() => onDeleteSlot(slot.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}

                {/* Container Content */}
                {container && (
                  <div className="p-2 h-full flex flex-col overflow-hidden">
                    <div className="flex items-start justify-between gap-1 flex-shrink-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{container.number}</p>
                        <p className="text-xs text-muted-foreground truncate">{container.type}</p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {progress}%
                      </Badge>
                    </div>

                    {activeProcess && (
                      <div className="mt-1.5 p-1.5 rounded bg-muted/50 flex-1 min-h-0 overflow-hidden">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs truncate flex-1 min-w-0">{activeProcess.process?.name}</span>
                          <span
                            className={cn(
                              'text-xs font-mono font-bold flex-shrink-0',
                              getElapsedPercentage(activeProcess.stage, activeProcess.process) >= 95
                                ? 'text-destructive animate-blink'
                                : 'text-primary'
                            )}
                          >
                            {getRemainingTime(activeProcess.stage, activeProcess.process)}
                          </span>
                        </div>
                        {activeProcess.worker && (
                          <div className="flex items-center gap-1 mt-1">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getWorkerColor(activeProcess.worker.id) }}
                            />
                            <span className="text-xs text-muted-foreground truncate">
                              {activeProcess.worker.name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Remove from slot */}
                    {!editMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-1 right-1 w-6 h-6 p-0 opacity-60 hover:opacity-100"
                        onClick={() => removeContainerFromSlot(container.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Empty slot indicator */}
                {!container && (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <Plus className="w-6 h-6 opacity-30" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default FactoryLayout;
