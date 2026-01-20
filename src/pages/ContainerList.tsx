import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Container as ContainerIcon,
  Calendar,
  ArrowUpDown,
  MoreVertical,
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
import { useContainerContext } from '@/contexts/ContainerContext';
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
  const { containers, deleteContainer } = useContainerContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState<'all' | 'above' | 'below'>('all');

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

  const handleDeleteAll = () => {
    containers.forEach(c => deleteContainer(c.id));
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
              <Button variant="destructive" size="sm" disabled={containers.length === 0}>
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
          
          <Button onClick={() => navigate('/container/new')} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Novo Container
          </Button>
        </div>
      </div>

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
                      {formatDate(container.startDate)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteContainer(container.id);
                            }}
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
