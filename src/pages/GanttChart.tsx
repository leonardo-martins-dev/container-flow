import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  LayoutGrid,
  User,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useContainerContext } from '@/contexts/ContainerContext';
import { getWorkerColor } from '@/data/mockData';
import {
  formatDateTime,
  formatTime,
  calculateProgress,
  getRemainingTime,
  getElapsedPercentage,
  cn,
} from '@/lib/utils';

type ViewMode = 'timeline' | 'chart' | 'individual';

const GanttChart: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightedContainerId = searchParams.get('container');
  
  const { containers, processes, workers, updateContainer } = useContainerContext();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [selectedStage, setSelectedStage] = useState<{
    containerId: number;
    processId: number;
  } | null>(null);
  const [, setTick] = useState(0);

  // Update every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get all process stages with container info
  const allStages = useMemo(() => {
    return containers.flatMap(container =>
      container.processStages.map(stage => ({
        ...stage,
        containerId: container.id,
        containerNumber: container.number,
        containerType: container.type,
      }))
    );
  }, [containers]);

  // Worker process counts
  const workerProcessCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    workers.forEach(w => {
      counts[w.id] = allStages.filter(s =>
        s.assignedWorkerIds.includes(w.id) &&
        (s.status === 'in_progress' || s.status === 'scheduled')
      ).length;
    });
    return counts;
  }, [workers, allStages]);

  const handleStageAction = (action: string) => {
    if (!selectedStage) return;
    
    const container = containers.find(c => c.id === selectedStage.containerId);
    if (!container) return;

    const updatedStages = container.processStages.map(stage => {
      if (stage.processId !== selectedStage.processId) return stage;

      switch (action) {
        case 'start':
          return { ...stage, status: 'in_progress' as const, actualStartTime: new Date().toISOString() };
        case 'finish':
          return { ...stage, status: 'completed' as const, actualEndTime: new Date().toISOString() };
        case 'cancel':
          return { ...stage, status: 'cancelled' as const };
        case 'restart':
          return { ...stage, status: 'in_progress' as const, actualStartTime: new Date().toISOString(), actualEndTime: null };
        case 'add15':
          return { ...stage, estimatedDuration: stage.estimatedDuration + 15 };
        case 'add30':
          return { ...stage, estimatedDuration: stage.estimatedDuration + 30 };
        case 'add60':
          return { ...stage, estimatedDuration: stage.estimatedDuration + 60 };
        case 'remove15':
          return { ...stage, estimatedDuration: Math.max(15, stage.estimatedDuration - 15) };
        case 'remove30':
          return { ...stage, estimatedDuration: Math.max(15, stage.estimatedDuration - 30) };
        default:
          return stage;
      }
    });

    updateContainer(container.id, { processStages: updatedStages });
    setSelectedStage(null);
  };

  const selectedStageData = useMemo(() => {
    if (!selectedStage) return null;
    const container = containers.find(c => c.id === selectedStage.containerId);
    if (!container) return null;
    const stage = container.processStages.find(s => s.processId === selectedStage.processId);
    const process = processes.find(p => p.id === selectedStage.processId);
    return { container, stage, process };
  }, [selectedStage, containers, processes]);

  const renderTimeline = () => (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="min-w-[1200px] p-4">
        {/* Timeline header */}
        <div className="flex mb-4 border-b border-border/50 pb-2">
          <div className="w-64 flex-shrink-0" />
          <div className="flex-1 flex">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 text-center text-xs text-muted-foreground">
                {i.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Container rows */}
        {containers.map((container) => {
          const progress = calculateProgress(container.processStages);
          const isHighlighted = highlightedContainerId === container.id.toString();

          return (
            <motion.div
              key={container.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'flex items-center mb-3 p-2 rounded-lg transition-all',
                isHighlighted && 'ring-2 ring-primary bg-primary/5'
              )}
            >
              {/* Container info */}
              <div className="w-64 flex-shrink-0 pr-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm">{container.number}</p>
                    <p className="text-xs text-muted-foreground">{container.type}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {progress}%
                  </Badge>
                </div>
              </div>

              {/* Process bars */}
              <div className="flex-1 relative h-10 bg-muted/20 rounded-lg overflow-hidden">
                {container.processStages.map((stage) => {
                  const process = processes.find(p => p.id === stage.processId);
                  const worker = workers.find(w => stage.assignedWorkerIds.includes(w.id));
                  if (!process) return null;

                  // Calculate position based on scheduled time
                  const startHour = stage.scheduledStartTime
                    ? new Date(stage.scheduledStartTime).getHours() + new Date(stage.scheduledStartTime).getMinutes() / 60
                    : 7;
                  const duration = stage.estimatedDuration / 60; // hours
                  const left = `${(startHour / 24) * 100}%`;
                  const width = `${Math.min((duration / 24) * 100, 100 - (startHour / 24) * 100)}%`;

                  const statusColors = {
                    pending: 'bg-muted',
                    scheduled: 'bg-accent/50',
                    in_progress: 'bg-accent',
                    completed: 'bg-success',
                    cancelled: 'bg-destructive/50',
                  };

                  return (
                    <motion.div
                      key={stage.processId}
                      className={cn(
                        'absolute top-1 bottom-1 rounded cursor-pointer transition-all',
                        'hover:scale-y-110 hover:z-10',
                        statusColors[stage.status]
                      )}
                      style={{
                        left,
                        width,
                        backgroundColor: worker ? getWorkerColor(worker.id) : undefined,
                      }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedStage({ containerId: container.id, processId: stage.processId })}
                    >
                      <div className="h-full flex items-center justify-center overflow-hidden px-1">
                        <span className="text-xs font-medium text-primary-foreground truncate">
                          {process.name}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  const renderChart = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {containers.map((container) => {
        const progress = calculateProgress(container.processStages);

        return (
          <Card key={container.id} className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{container.number}</CardTitle>
                <Badge variant="outline">{progress}%</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{container.type}</p>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2 mb-4" />
              <div className="space-y-2">
                {container.processStages.slice(0, 5).map((stage) => {
                  const process = processes.find(p => p.id === stage.processId);
                  const worker = workers.find(w => stage.assignedWorkerIds.includes(w.id));
                  if (!process) return null;

                  return (
                    <div
                      key={stage.processId}
                      className="flex items-center justify-between text-sm p-2 rounded bg-muted/30 cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedStage({ containerId: container.id, processId: stage.processId })}
                    >
                      <span className="truncate">{process.name}</span>
                      <div className="flex items-center gap-2">
                        {worker && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getWorkerColor(worker.id) }}
                          />
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            stage.status === 'completed' && 'border-success text-success',
                            stage.status === 'in_progress' && 'border-accent text-accent',
                          )}
                        >
                          {stage.status === 'completed' ? '✓' : stage.status === 'in_progress' ? '▶' : '○'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderIndividual = () => {
    const workerStages = selectedWorker
      ? allStages.filter(s => s.assignedWorkerIds.includes(selectedWorker))
      : [];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Select
            value={selectedWorker?.toString() || ''}
            onValueChange={(v) => setSelectedWorker(v ? Number(v) : null)}
          >
            <SelectTrigger className="w-64 industrial-input">
              <SelectValue placeholder="Selecione um trabalhador" />
            </SelectTrigger>
            <SelectContent className="glass">
              {workers
                .sort((a, b) => workerProcessCounts[b.id] - workerProcessCounts[a.id])
                .map((worker) => (
                  <SelectItem key={worker.id} value={worker.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getWorkerColor(worker.id) }}
                      />
                      {worker.name}
                      <Badge variant="outline" className="ml-2">
                        {workerProcessCounts[worker.id]} processos
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {selectedWorker && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workerStages.map((stage) => {
              const process = processes.find(p => p.id === stage.processId);
              if (!process) return null;

              const remaining = stage.status === 'in_progress' ? getRemainingTime(stage, process) : '--:--';
              const elapsed = stage.status === 'in_progress' ? getElapsedPercentage(stage, process) : 0;

              return (
                <Card
                  key={`${stage.containerId}-${stage.processId}`}
                  className="glass cursor-pointer hover:border-primary/30"
                  onClick={() => setSelectedStage({ containerId: stage.containerId, processId: stage.processId })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{process.name}</p>
                        <p className="text-sm text-muted-foreground">{stage.containerNumber}</p>
                      </div>
                      <Badge
                        className={cn(
                          stage.status === 'completed' && 'status-badge-completed',
                          stage.status === 'in_progress' && 'status-badge-in-progress',
                          stage.status === 'pending' && 'status-badge-pending',
                        )}
                      >
                        {stage.status}
                      </Badge>
                    </div>
                    {stage.status === 'in_progress' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Restante</span>
                          <span className="font-mono font-bold text-primary">{remaining}</span>
                        </div>
                        <Progress value={elapsed} className="h-2" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Duração: {formatTime(stage.estimatedDuration)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!selectedWorker && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <User className="w-12 h-12 mr-4 opacity-50" />
            <p>Selecione um trabalhador para ver seus processos</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Cronograma Gantt</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie o cronograma de todos os containers
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Recalcular
        </Button>
      </div>

      {/* View Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList className="glass">
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="chart" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="individual" className="gap-2">
            <User className="w-4 h-4" />
            Individual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <Card className="glass overflow-hidden">
            {renderTimeline()}
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          {renderChart()}
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          {renderIndividual()}
        </TabsContent>
      </Tabs>

      {/* Stage Action Dialog */}
      <Dialog open={!!selectedStage} onOpenChange={() => setSelectedStage(null)}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedStageData?.process?.name}</DialogTitle>
            <DialogDescription>
              {selectedStageData?.container?.number} - {selectedStageData?.stage?.status}
            </DialogDescription>
          </DialogHeader>

          {selectedStageData?.stage && (
            <div className="space-y-4">
              {/* Status info */}
              <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duração estimada</span>
                  <span className="font-medium">{formatTime(selectedStageData.stage.estimatedDuration)}</span>
                </div>
                {selectedStageData.stage.actualStartTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Iniciado em</span>
                    <span className="font-medium">{formatDateTime(selectedStageData.stage.actualStartTime)}</span>
                  </div>
                )}
              </div>

              {/* Actions based on status */}
              <div className="flex flex-wrap gap-2">
                {(selectedStageData.stage.status === 'scheduled' || selectedStageData.stage.status === 'pending') && (
                  <>
                    <Button onClick={() => handleStageAction('start')} className="gradient-primary text-primary-foreground gap-2">
                      <Play className="w-4 h-4" />
                      Iniciar
                    </Button>
                    <Button onClick={() => handleStageAction('cancel')} variant="destructive" className="gap-2">
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </Button>
                  </>
                )}

                {selectedStageData.stage.status === 'in_progress' && (
                  <>
                    <Button onClick={() => handleStageAction('finish')} className="bg-success hover:bg-success/90 gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Finalizar
                    </Button>
                    <Button onClick={() => handleStageAction('cancel')} variant="destructive" className="gap-2">
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </Button>
                  </>
                )}

                {(selectedStageData.stage.status === 'completed' || selectedStageData.stage.status === 'cancelled') && (
                  <Button onClick={() => handleStageAction('restart')} variant="outline" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Reiniciar
                  </Button>
                )}
              </div>

              {/* Time adjustments */}
              {selectedStageData.stage.status === 'in_progress' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Ajustar tempo:</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStageAction('add15')}>
                      <Plus className="w-3 h-3 mr-1" />15m
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStageAction('add30')}>
                      <Plus className="w-3 h-3 mr-1" />30m
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStageAction('add60')}>
                      <Plus className="w-3 h-3 mr-1" />1h
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStageAction('remove15')}>
                      <Minus className="w-3 h-3 mr-1" />15m
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStageAction('remove30')}>
                      <Minus className="w-3 h-3 mr-1" />30m
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedStage(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GanttChart;
