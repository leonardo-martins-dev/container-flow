import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Container as ContainerIcon,
  MoreVertical,
  RefreshCw,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useContainerContext } from '@/contexts/ContainerContext';
import { getPatrimoniosDisponiveis, getCronogramaMacro } from '@/lib/api';
import type { PatrimonioRow } from '@/lib/api';
import {
  calculateProgress,
  formatDate,
  getDeadlineStatus,
  cn,
} from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Pendente', class: 'status-badge-pending' },
  in_progress: { label: 'Em Progresso', class: 'status-badge-in-progress' },
  completed: { label: 'Concluído', class: 'status-badge-completed' },
  cancelled: { label: 'Cancelado', class: 'status-badge-overdue' },
};

const ContainerList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { containers, deleteContainer, syncContainersFromApi } = useContainerContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState<'all' | 'above' | 'below'>('all');
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [inicioPorPropostaId, setInicioPorPropostaId] = useState<Map<number, string>>(new Map());
  const [patrimoniosOpen, setPatrimoniosOpen] = useState(false);
  const [patrimonios, setPatrimonios] = useState<PatrimonioRow[]>([]);
  const [patrimoniosLoading, setPatrimoniosLoading] = useState(false);
  const [patrimoniosError, setPatrimoniosError] = useState<string | null>(null);

  useEffect(() => {
    getCronogramaMacro()
      .then((data) => {
        const map = new Map<number, string>();
        (data.assignments || []).forEach((a: { propostaId?: number; inicioPrevisto?: string }) => {
          if (a.propostaId != null && a.inicioPrevisto) {
            const dateStr = typeof a.inicioPrevisto === 'string' ? a.inicioPrevisto.slice(0, 10) : '';
            const current = map.get(a.propostaId);
            if (!current || dateStr < current) map.set(a.propostaId, dateStr);
          }
        });
        setInicioPorPropostaId(map);
      })
      .catch(() => setInicioPorPropostaId(new Map()));
  }, [containers.length]);

  useEffect(() => {
    if (patrimoniosOpen) {
      setPatrimoniosLoading(true);
      setPatrimoniosError(null);
      getPatrimoniosDisponiveis()
        .then(setPatrimonios)
        .catch((e) => setPatrimoniosError(e instanceof Error ? e.message : 'Erro ao carregar'))
        .finally(() => setPatrimoniosLoading(false));
    }
  }, [patrimoniosOpen]);

  const handleSincronizar = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      await syncContainersFromApi();
      const data = await getCronogramaMacro();
      const map = new Map<number, string>();
      (data.assignments || []).forEach((a: { propostaId?: number; inicioPrevisto?: string }) => {
        if (a.propostaId != null && a.inicioPrevisto) {
          const dateStr = typeof a.inicioPrevisto === 'string' ? a.inicioPrevisto.slice(0, 10) : '';
          const current = map.get(a.propostaId);
          if (!current || dateStr < current) map.set(a.propostaId, dateStr);
        }
      });
      setInicioPorPropostaId(map);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const avgProgress = containers.length > 0
    ? containers.reduce((acc, c) => acc + calculateProgress(c.processStages), 0) / containers.length
    : 0;

  const filteredContainers = containers
    .filter(c => {
      const matchesSearch = c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.cliente.toLowerCase().includes(searchTerm.toLowerCase());
      const progress = calculateProgress(c.processStages);
      const matchesProgress = progressFilter === 'all' ||
                             (progressFilter === 'above' && progress >= avgProgress) ||
                             (progressFilter === 'below' && progress < avgProgress);
      return matchesSearch && matchesProgress;
    })
    .sort((a, b) => new Date(a.deliveryDeadline).getTime() - new Date(b.deliveryDeadline).getTime());

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    let failed = 0;
    try {
      for (const c of containers) {
        try {
          await deleteContainer(c.id);
        } catch {
          failed++;
        }
      }
      if (failed > 0) {
        toast({
          variant: 'destructive',
          title: 'Erro ao deletar',
          description: `${failed} container(es) não puderam ser removidos.`,
        });
      } else {
        toast({ title: 'Containers removidos', description: 'Todos os containers foram deletados.' });
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar',
        description: e instanceof Error ? e.message : 'Erro ao remover containers.',
      });
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDeleteOne = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteContainer(id);
      toast({ title: 'Container removido', description: 'O container foi deletado.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar',
        description: e instanceof Error ? e.message : 'Erro ao remover o container.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Containers</h1>
          <p className="text-muted-foreground mt-1">
            {containers.length} containers cadastrados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={containers.length === 0 || deletingAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Todos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass">
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá deletar todos os {containers.length} containers. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="gradient-primary text-primary-foreground">
                  Deletar Todos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Dialog open={patrimoniosOpen} onOpenChange={setPatrimoniosOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Package className="w-4 h-4 mr-2" />
                Patrimônios disponíveis
              </Button>
            </DialogTrigger>
            <DialogContent className="glass max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Patrimônios disponíveis</DialogTitle>
              </DialogHeader>
              <div className="overflow-auto flex-1 min-h-0">
                {patrimoniosLoading && <p className="text-muted-foreground text-sm">Carregando...</p>}
                {patrimoniosError && <p className="text-destructive text-sm">{patrimoniosError}</p>}
                {!patrimoniosLoading && !patrimoniosError && (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>TIPO</TableHead>
                        <TableHead>GRUPO</TableHead>
                        <TableHead>Patrimonio</TableHead>
                        <TableHead>Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patrimonios.map((p) => (
                        <TableRow key={p.Id}>
                          <TableCell>{p.TIPO ?? '-'}</TableCell>
                          <TableCell>{p.GRUPO ?? '-'}</TableCell>
                          <TableCell className="font-medium">{p.Patrimonio ?? '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{p.Descrição ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {!patrimoniosLoading && !patrimoniosError && patrimonios.length === 0 && (
                  <p className="text-muted-foreground text-sm py-4">Nenhum patrimônio disponível.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSincronizar}
            disabled={syncing}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', syncing && 'animate-spin')} />
            Sincronizar
          </Button>
          <Button onClick={() => navigate('/container/new')} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Novo Container
          </Button>
        </div>
      </div>
      {syncError && (
        <p className="text-sm text-destructive">{syncError}</p>
      )}

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 industrial-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={progressFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProgressFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={progressFilter === 'above' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProgressFilter('above')}
              >
                Acima da média
              </Button>
              <Button
                variant={progressFilter === 'below' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProgressFilter('below')}
              >
                Abaixo da média
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Número</TableHead>
                <TableHead className="text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-muted-foreground">Início</TableHead>
                <TableHead className="text-muted-foreground">Prazo</TableHead>
                <TableHead className="text-muted-foreground">Progresso</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContainers.map((container, index) => {
                const progress = calculateProgress(container.processStages);
                const deadlineStatus = getDeadlineStatus(container.deliveryDeadline);
                const status = statusConfig[container.currentStatus];

                return (
                  <motion.tr
                    key={container.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-border/30 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/gantt?container=${container.id}`)}
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      #{container.id}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">{container.number}</span>
                    </TableCell>
                    <TableCell>{container.type}</TableCell>
                    <TableCell>{container.cliente || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {inicioPorPropostaId.get(container.id)
                        ? formatDate(inicioPorPropostaId.get(container.id)!)
                        : container.startDate
                          ? formatDate(container.startDate)
                          : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        deadlineStatus === 'overdue' && 'text-destructive',
                        deadlineStatus === 'urgent' && 'text-destructive',
                        deadlineStatus === 'warning' && 'text-warning',
                      )}>
                        {formatDate(container.deliveryDeadline)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-10">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.class}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/container/${container.id}`);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleDeleteOne(container.id);
                            }}
                            disabled={deletingId === container.id}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>

          {filteredContainers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <ContainerIcon className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum container encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContainerList;
