import React, { useMemo, useState, useEffect } from 'react';
import { Container as ContainerIcon, AlertTriangle, TrendingUp, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useContainerContext } from '@/contexts/ContainerContext';
import { calculateProgress, getDeadlineStatus } from '@/lib/utils';

const DashboardTV: React.FC = () => {
  const { containers, processes } = useContainerContext();
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const avgProgress = containers.length > 0
    ? Math.round(containers.reduce((acc, c) => acc + calculateProgress(c.processStages), 0) / containers.length)
    : 0;
  const inProgress = containers.filter((c) => c.currentStatus === 'in_progress').length;
  const overdue = containers.filter((c) => getDeadlineStatus(c.deliveryDeadline) === 'overdue').length;
  const bottlenecks = useMemo(() => {
    const list: string[] = [];
    if (overdue > 0) list.push(`${overdue} container(s) atrasado(s)`);
    const byProcess: Record<number, number> = {};
    containers.forEach((c) => {
      c.processStages.filter((s) => s.status === 'in_progress').forEach((s) => {
        byProcess[s.processId] = (byProcess[s.processId] || 0) + 1;
      });
    });
    const maxLoad = Math.max(0, ...Object.values(byProcess));
    if (maxLoad > 2) list.push('Processos com fila (sobrecarga)');
    return list;
  }, [containers, overdue]);

  return (
    <div className="min-h-screen bg-background p-8 text-2xl md:text-3xl">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gradient-primary">Container Flow — Chão de Fábrica</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ContainerIcon className="w-8 h-8" />
              Progresso global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={avgProgress} className="h-6" />
            <p className="mt-2 font-mono text-3xl">{avgProgress}%</p>
            <p className="text-muted-foreground text-xl">{inProgress} em produção</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="w-8 h-8" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl">{containers.length} containers</p>
            <p className="text-xl text-muted-foreground">{processes.length} processos</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="w-8 h-8" />
              Gargalos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bottlenecks.length === 0 ? (
              <p className="text-success text-xl">Nenhum gargalo no momento</p>
            ) : (
              <ul className="space-y-2 text-xl text-destructive">
                {bottlenecks.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Layers className="w-8 h-8" />
            Containers em andamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {containers.filter((c) => c.currentStatus === 'in_progress').slice(0, 12).map((c) => (
              <div key={c.id} className="px-4 py-2 rounded-lg bg-accent/20 text-lg font-medium">
                {c.number} — {calculateProgress(c.processStages)}%
              </div>
            ))}
            {containers.filter((c) => c.currentStatus === 'in_progress').length === 0 && (
              <p className="text-muted-foreground text-xl">Nenhum container em produção no momento.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTV;
