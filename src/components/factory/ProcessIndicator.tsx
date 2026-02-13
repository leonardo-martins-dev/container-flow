import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Container, Process, Worker } from '@/data/mockData';

interface ProcessIndicatorProps {
  container: Container;
  processes: Process[];
  workers: Worker[];
  className?: string;
}

export const ProcessIndicator: React.FC<ProcessIndicatorProps> = ({
  container,
  processes,
  workers,
  className,
}) => {
  // Get active process stage
  const activeStage = container.processStages.find(s => s.status === 'in_progress');
  
  if (!activeStage) {
    return (
      <div className={cn('p-2 rounded bg-muted/30 text-center', className)}>
        <span className="text-xs text-muted-foreground">Sem processo ativo</span>
      </div>
    );
  }

  // Get process and worker details
  const process = processes.find(p => p.id === activeStage.processId);
  const worker = workers.find(w => activeStage.assignedWorkerIds.includes(w.id));

  // Calculate time progress
  const now = new Date();
  const startTime = activeStage.actualStartTime ? new Date(activeStage.actualStartTime) : now;
  const estimatedDuration = process?.estimatedDuration || 0;
  const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
  const progressPercentage = estimatedDuration > 0 ? Math.min((elapsedMinutes / estimatedDuration) * 100, 100) : 0;
  const remainingMinutes = Math.max(estimatedDuration - elapsedMinutes, 0);

  // Format remaining time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Determine urgency
  const isOverdue = elapsedMinutes > estimatedDuration;
  const isNearDeadline = progressPercentage > 90;

  return (
    <motion.div
      className={cn(
        'p-1.5 rounded border transition-all h-full flex flex-col justify-between overflow-hidden',
        isOverdue ? 'bg-destructive/10 border-destructive/30' : 
        isNearDeadline ? 'bg-warning/10 border-warning/30' : 
        'bg-primary/10 border-primary/30',
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Process Name - compact */}
      <div className="flex items-center justify-between mb-1 min-h-0">
        <span className="text-xs font-medium truncate flex-1 pr-1 leading-tight">
          {process?.name || 'Processo Desconhecido'}
        </span>
        {isOverdue && (
          <AlertTriangle className="w-2.5 h-2.5 text-destructive animate-pulse flex-shrink-0" />
        )}
      </div>

      {/* Progress Bar - thinner */}
      <Progress 
        value={progressPercentage} 
        className={cn(
          'h-1 mb-1',
          isOverdue && '[&>div]:bg-destructive',
          isNearDeadline && '[&>div]:bg-warning'
        )}
      />

      {/* Time and Worker Info - compact */}
      <div className="flex items-center justify-between text-xs gap-1 min-h-0">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Clock className="w-2.5 h-2.5 flex-shrink-0" />
          <span className={cn(
            'font-mono text-xs truncate',
            isOverdue ? 'text-destructive font-bold' : 
            isNearDeadline ? 'text-warning' : 
            'text-muted-foreground'
          )}>
            {isOverdue ? 'ATRASO' : formatTime(remainingMinutes)}
          </span>
        </div>
        
        {worker && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <User className="w-2.5 h-2.5" />
            <span className="text-muted-foreground text-xs truncate max-w-[40px]">
              {worker.name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      {/* Status Badge - smaller */}
      <div className="mt-1 flex justify-center">
        <Badge 
          variant={isOverdue ? 'destructive' : isNearDeadline ? 'secondary' : 'outline'}
          className="text-xs px-1.5 py-0 h-4 leading-none"
        >
          {Math.round(progressPercentage)}%
        </Badge>
      </div>
    </motion.div>
  );
};