import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Container as ContainerIcon, Search, Filter, SortAsc } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Container } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface ContainerPoolProps {
  containers: Container[];
  onContainerDragStart: (containerId: number) => void;
  onContainerDragEnd: () => void;
  draggedContainer: number | null;
  className?: string;
}

type SortOption = 'deadline' | 'progress' | 'type' | 'client';
type FilterOption = 'all' | 'pending' | 'in_progress' | 'urgent';

export const ContainerPool: React.FC<ContainerPoolProps> = ({
  containers,
  onContainerDragStart,
  onContainerDragEnd,
  draggedContainer,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('deadline');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Calculate container metrics
  const getContainerMetrics = (container: Container) => {
    const completedStages = container.processStages.filter(s => s.status === 'completed').length;
    const totalStages = container.processStages.length;
    const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
    
    const daysRemaining = Math.ceil(
      (new Date(container.deliveryDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const isUrgent = daysRemaining <= 2;
    const isWarning = daysRemaining <= 5;
    
    return {
      progress,
      daysRemaining,
      isUrgent,
      isWarning,
      hasActiveProcess: container.processStages.some(s => s.status === 'in_progress'),
    };
  };

  // Filter containers
  const filteredContainers = containers.filter(container => {
    const metrics = getContainerMetrics(container);
    
    // Search filter
    const matchesSearch = 
      container.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Status filter
    switch (filterBy) {
      case 'pending':
        return container.currentStatus === 'pending';
      case 'in_progress':
        return container.currentStatus === 'in_progress';
      case 'urgent':
        return metrics.isUrgent;
      default:
        return true;
    }
  });

  // Sort containers
  const sortedContainers = [...filteredContainers].sort((a, b) => {
    const metricsA = getContainerMetrics(a);
    const metricsB = getContainerMetrics(b);
    
    switch (sortBy) {
      case 'deadline':
        return metricsA.daysRemaining - metricsB.daysRemaining;
      case 'progress':
        return metricsB.progress - metricsA.progress;
      case 'type':
        return a.type.localeCompare(b.type);
      case 'client':
        return a.cliente.localeCompare(b.cliente);
      default:
        return 0;
    }
  });

  const getDeadlineColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'destructive';
    if (daysRemaining <= 2) return 'destructive';
    if (daysRemaining <= 5) return 'secondary';
    return 'outline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ContainerIcon className="w-4 h-4 text-primary" />
          Containers Disponíveis
          <Badge variant="outline" className="ml-auto">
            {sortedContainers.length}
          </Badge>
        </CardTitle>
        
        {/* Search and Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar containers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="h-8 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="urgent">Urgentes</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SortAsc className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Prazo</SelectItem>
                <SelectItem value="progress">Progresso</SelectItem>
                <SelectItem value="type">Tipo</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[500px] px-4">
          <div className="space-y-2 pb-4">
            {sortedContainers.length === 0 ? (
              <div className="text-center py-8">
                <ContainerIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm || filterBy !== 'all' 
                    ? 'Nenhum container encontrado'
                    : 'Todos os containers estão alocados'
                  }
                </p>
              </div>
            ) : (
              sortedContainers.map((container) => {
                const metrics = getContainerMetrics(container);
                
                return (
                  <div
                    key={container.id}
                    draggable
                    onDragStart={(e: React.DragEvent) => {
                      onContainerDragStart(container.id);
                      e.dataTransfer.setData('text/plain', container.id.toString());
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={onContainerDragEnd}
                    className={cn(
                      'p-3 rounded-lg border cursor-grab active:cursor-grabbing',
                      'bg-card hover:border-primary/30 transition-all',
                      draggedContainer === container.id && 'opacity-50 scale-95'
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{container.number}</p>
                        <p className="text-xs text-muted-foreground truncate">{container.type}</p>
                        <p className="text-xs text-muted-foreground truncate">{container.cliente}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={getDeadlineColor(metrics.daysRemaining)}
                          className="text-xs"
                        >
                          {metrics.daysRemaining}d
                        </Badge>
                        <Badge
                          variant={getStatusColor(container.currentStatus)}
                          className="text-xs"
                        >
                          {container.currentStatus}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Progresso</span>
                        <span className="text-xs font-medium">{metrics.progress}%</span>
                      </div>
                      <Progress value={metrics.progress} className="h-1" />
                    </div>
                    
                    {/* Active Process Indicator */}
                    {metrics.hasActiveProcess && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs text-primary font-medium">Em processamento</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};