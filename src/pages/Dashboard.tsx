import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Container as ContainerIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Timer,
  TrendingUp,
  Users,
  Layers,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useContainerContext } from '@/contexts/ContainerContext';
import {
  calculateProgress,
  calculateDaysRemaining,
  getDeadlineStatus,
  formatDate,
  getRemainingTime,
  getElapsedPercentage,
  cn,
} from '@/lib/utils';
import { getWorkerColor } from '@/data/mockData';

const statusConfig = {
  pending: { label: 'Pendente', class: 'status-badge-pending' },
  in_progress: { label: 'Em Progresso', class: 'status-badge-in-progress' },
  completed: { label: 'Concluído', class: 'status-badge-completed' },
  cancelled: { label: 'Cancelado', class: 'status-badge-overdue' },
};

const deadlineConfig = {
  overdue: { label: 'Atrasado', class: 'text-destructive', bgClass: 'bg-destructive/10 border-destructive/30' },
  urgent: { label: 'Urgente', class: 'text-destructive', bgClass: 'bg-destructive/10 border-destructive/30' },
  warning: { label: 'Atenção', class: 'text-warning', bgClass: 'bg-warning/10 border-warning/30' },
  normal: { label: 'Normal', class: 'text-foreground', bgClass: 'bg-card' },
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { containers, processes, workers, factorySlots, factorySlots2 } = useContainerContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [, setTick] = useState(0);

  // Update every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    const inProgress = containers.filter(c => c.currentStatus === 'in_progress').length;
    const overdue = containers.filter(c => getDeadlineStatus(c.deliveryDeadline) === 'overdue').length;
    const activeProcesses = containers.reduce((acc, c) => 
      acc + c.processStages.filter(s => s.status === 'in_progress').length, 0
    );
    const avgProgress = containers.length > 0
      ? Math.round(containers.reduce((acc, c) => acc + calculateProgress(c.processStages), 0) / containers.length)
      : 0;

    return [
      { icon: ContainerIcon, label: 'Em Produção', value: inProgress, color: 'text-accent', bgColor: 'bg-accent/10' },
      { icon: AlertTriangle, label: 'Atrasados', value: overdue, color: 'text-destructive', bgColor: 'bg-destructive/10' },
      { icon: Layers, label: 'Processos Ativos', value: activeProcesses, color: 'text-success', bgColor: 'bg-success/10' },
      { icon: TrendingUp, label: 'Progresso Médio', value: `${avgProgress}%`, color: 'text-primary', bgColor: 'bg-primary/10' },
    ];
  }, [containers]);

  // Filter and sort containers
  const sortedContainers = useMemo(() => {
    return [...containers]
      .filter(c => c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   c.cliente.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(a.deliveryDeadline).getTime() - new Date(b.deliveryDeadline).getTime());
  }, [containers, searchTerm]);

  const getSlotName = (containerId: number) => {
    const slot1 = factorySlots.find(s => s.containerId === containerId);
    if (slot1) return slot1.name;
    const slot2 = factorySlots2.find(s => s.containerId === containerId);
    if (slot2) return slot2.name;
    return null;
  };

  const getActiveProcesses = (container: typeof containers[0]) => {
    return container.processStages.filter(s => s.status === 'in_progress');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema de containers</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar container..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 pl-10 industrial-input"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="kpi-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{kpi.label}</p>
                    <p className={cn('text-3xl font-bold mt-1', kpi.color)}>{kpi.value}</p>
                  </div>
                  <div className={cn('p-3 rounded-xl', kpi.bgColor)}>
                    <kpi.icon className={cn('w-6 h-6', kpi.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Container Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedContainers.map((container, index) => {
          const progress = calculateProgress(container.processStages);
          const daysRemaining = calculateDaysRemaining(container.deliveryDeadline);
          const deadlineStatus = getDeadlineStatus(container.deliveryDeadline);
          const slotName = getSlotName(container.id);
          const activeProcesses = getActiveProcesses(container);
          const status = statusConfig[container.currentStatus];
          const deadline = deadlineConfig[deadlineStatus];

          return (
            <motion.div
              key={container.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  'container-card cursor-pointer',
                  deadline.bgClass
                )}
                onClick={() => navigate(`/gantt?container=${container.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">{container.number}</CardTitle>
                      <p className="text-sm text-muted-foreground">{container.type}</p>
                    </div>
                    <Badge className={status.class}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client & Slot */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{container.cliente}</span>
                    {slotName && (
                      <Badge variant="outline" className="text-accent border-accent/30">
                        {slotName}
                      </Badge>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/30 rounded p-1 -m-1 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/container/${container.id}`);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className={cn('w-4 h-4', deadline.class)} />
                      <span className={deadline.class}>
                        {daysRemaining <= 0 ? 'Atrasado' : `${daysRemaining} dias`}
                      </span>
                    </div>
                    <span className="text-muted-foreground">{formatDate(container.deliveryDeadline)}</span>
                  </div>

                  {/* Active Processes */}
                  {activeProcesses.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      {activeProcesses.length > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          {activeProcesses.length}P
                        </Badge>
                      )}
                      {activeProcesses.slice(0, 2).map((stage) => {
                        const process = processes.find(p => p.id === stage.processId);
                        const worker = workers.find(w => stage.assignedWorkerIds.includes(w.id));
                        if (!process) return null;

                        const remaining = getRemainingTime(stage, process);
                        const elapsed = getElapsedPercentage(stage, process);

                        return (
                          <div
                            key={stage.processId}
                            className="p-2 rounded-lg bg-muted/30 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium truncate">{process.name}</span>
                              <span
                                className={cn(
                                  'text-xs font-mono font-bold',
                                  elapsed >= 100 ? 'text-destructive animate-blink' : 'text-primary'
                                )}
                              >
                                {remaining}
                              </span>
                            </div>
                            {worker && (
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getWorkerColor(worker.id) }}
                                />
                                <span className="text-xs text-muted-foreground truncate">
                                  {worker.name}
                                </span>
                              </div>
                            )}
                            <Progress value={elapsed} className="h-1" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {sortedContainers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ContainerIcon className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Nenhum container encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Tente ajustar sua busca' : 'Adicione containers para começar'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
