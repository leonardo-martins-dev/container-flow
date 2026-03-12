import React, { useState, useEffect } from 'react';
import { Container as ContainerIcon, AlertTriangle, TrendingUp, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getDashboardTVData, type DashboardTVData } from '@/lib/api';

const defaultData: DashboardTVData = {
  avgProgress: 0,
  inProgress: 0,
  overdue: 0,
  bottlenecks: [],
  containersInProgress: [],
  totalContainers: 0,
  totalProcesses: 0,
};

const DashboardTV: React.FC = () => {
  const [data, setData] = useState<DashboardTVData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const load = () => {
    getDashboardTVData()
      .then(setData)
      .catch(() => setData(defaultData))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      load();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && data === defaultData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-xl">Carregando...</p>
      </div>
    );
  }

  const { avgProgress, inProgress, bottlenecks, containersInProgress, totalContainers, totalProcesses } = data;

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
            <p className="text-3xl">{totalContainers} containers</p>
            <p className="text-xl text-muted-foreground">{totalProcesses} processos</p>
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
            {containersInProgress.map((c) => (
              <div key={c.id} className="px-4 py-2 rounded-lg bg-accent/20 text-lg font-medium">
                {c.number} — {c.progress}%
              </div>
            ))}
            {containersInProgress.length === 0 && (
              <p className="text-muted-foreground text-xl">Nenhum container em produção no momento.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTV;
