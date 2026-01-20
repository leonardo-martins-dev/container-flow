import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Clock,
  Users,
  GripVertical,
  Layers,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContainerContext } from '@/contexts/ContainerContext';
import { formatTime, cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const ProcessesList: React.FC = () => {
  const { processes, workers, sequencingRules, addProcess, updateProcess, deleteProcess, updateSequencingRule } = useContainerContext();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTime, setEditTime] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProcess, setNewProcess] = useState({ name: '', averageTimeMinutes: 60 });

  const handleEdit = (process: typeof processes[0]) => {
    setEditingId(process.id);
    setEditName(process.name);
    setEditTime(process.averageTimeMinutes.toString());
  };

  const handleSaveEdit = (id: number) => {
    updateProcess(id, {
      name: editName,
      averageTimeMinutes: parseInt(editTime) || 60,
    });
    setEditingId(null);
    toast({ title: 'Processo atualizado' });
  };

  const handleAddProcess = () => {
    if (!newProcess.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    addProcess({
      name: newProcess.name.toUpperCase(),
      averageTimeMinutes: newProcess.averageTimeMinutes,
      order: processes.length + 1,
    });
    setShowNewModal(false);
    setNewProcess({ name: '', averageTimeMinutes: 60 });
    toast({ title: 'Processo adicionado' });
  };

  const handleDeleteProcess = (id: number) => {
    deleteProcess(id);
    toast({ title: 'Processo removido' });
  };

  const getWorkersForProcess = (processId: number) => {
    return workers.filter(w => w.specialtyProcessIds.includes(processId));
  };

  const getRule = (processId: number) => {
    return sequencingRules.find(r => r.processId === processId) || {
      processId,
      beforeProcesses: [],
      afterProcesses: [],
      parallelProcesses: [],
      separatedProcesses: [],
      sameWorkerProcesses: [],
      requiresSeniorJunior: false,
    };
  };

  const toggleRuleProcess = (ruleProcessId: number, targetProcessId: number, field: keyof typeof sequencingRules[0]) => {
    const rule = getRule(ruleProcessId);
    const currentList = (rule[field] as number[]) || [];
    const newList = currentList.includes(targetProcessId)
      ? currentList.filter(id => id !== targetProcessId)
      : [...currentList, targetProcessId];
    
    updateSequencingRule(ruleProcessId, { [field]: newList });

    // Bidirectional sync
    if (field === 'beforeProcesses') {
      const targetRule = getRule(targetProcessId);
      const targetAfter = targetRule.afterProcesses.includes(ruleProcessId)
        ? targetRule.afterProcesses
        : [...targetRule.afterProcesses, ruleProcessId];
      updateSequencingRule(targetProcessId, { afterProcesses: newList.includes(targetProcessId) ? targetAfter : targetRule.afterProcesses.filter(id => id !== ruleProcessId) });
    } else if (field === 'afterProcesses') {
      const targetRule = getRule(targetProcessId);
      const targetBefore = targetRule.beforeProcesses.includes(ruleProcessId)
        ? targetRule.beforeProcesses
        : [...targetRule.beforeProcesses, ruleProcessId];
      updateSequencingRule(targetProcessId, { beforeProcesses: newList.includes(targetProcessId) ? targetBefore : targetRule.beforeProcesses.filter(id => id !== ruleProcessId) });
    } else if (field === 'parallelProcesses') {
      const targetRule = getRule(targetProcessId);
      const targetParallel = newList.includes(targetProcessId)
        ? [...new Set([...targetRule.parallelProcesses, ruleProcessId])]
        : targetRule.parallelProcesses.filter(id => id !== ruleProcessId);
      updateSequencingRule(targetProcessId, { parallelProcesses: targetParallel });
    } else if (field === 'sameWorkerProcesses') {
      const targetRule = getRule(targetProcessId);
      const targetSame = newList.includes(targetProcessId)
        ? [...new Set([...targetRule.sameWorkerProcesses, ruleProcessId])]
        : targetRule.sameWorkerProcesses.filter(id => id !== ruleProcessId);
      updateSequencingRule(targetProcessId, { sameWorkerProcesses: targetSame });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Processos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie processos e regras de sequenciamento
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Novo Processo
        </Button>
      </div>

      <Tabs defaultValue="processes">
        <TabsList className="glass">
          <TabsTrigger value="processes" className="gap-2">
            <Layers className="w-4 h-4" />
            Processos
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <FileText className="w-4 h-4" />
            Regras de Sequenciamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="mt-4">
          <Card className="glass">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tempo Médio</TableHead>
                    <TableHead>Trabalhadores</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes
                    .sort((a, b) => a.order - b.order)
                    .map((process, index) => {
                      const processWorkers = getWorkersForProcess(process.id);
                      const isEditing = editingId === process.id;

                      return (
                        <motion.tr
                          key={process.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-border/30"
                        >
                          <TableCell>
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-48 h-8 industrial-input"
                              />
                            ) : (
                              <span className="font-medium">{process.name}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="w-24 h-8 industrial-input"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{formatTime(process.averageTimeMinutes)}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <Badge variant="outline">{processWorkers.length}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleSaveEdit(process.id)}
                                >
                                  <Save className="w-4 h-4 text-success" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEdit(process)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteProcess(process.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Regras de Sequenciamento</CardTitle>
              <CardDescription>
                Defina dependências e restrições entre processos. As regras são sincronizadas bidirecionalmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="sticky left-0 bg-card z-10">Processo</TableHead>
                      <TableHead>Depois de</TableHead>
                      <TableHead>Paralelo com</TableHead>
                      <TableHead>Mesmo Trabalhador</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processes.map((process) => {
                      const rule = getRule(process.id);
                      const otherProcesses = processes.filter(p => p.id !== process.id);

                      return (
                        <TableRow key={process.id} className="border-border/30">
                          <TableCell className="sticky left-0 bg-card z-10 font-medium">
                            {process.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {otherProcesses.slice(0, 6).map((p) => (
                                <Badge
                                  key={p.id}
                                  variant={rule.afterProcesses.includes(p.id) ? 'default' : 'outline'}
                                  className={cn(
                                    'cursor-pointer text-xs',
                                    rule.afterProcesses.includes(p.id) && 'gradient-primary'
                                  )}
                                  onClick={() => toggleRuleProcess(process.id, p.id, 'afterProcesses')}
                                >
                                  {p.name.slice(0, 8)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {otherProcesses.slice(0, 6).map((p) => (
                                <Badge
                                  key={p.id}
                                  variant={rule.parallelProcesses.includes(p.id) ? 'default' : 'outline'}
                                  className={cn(
                                    'cursor-pointer text-xs',
                                    rule.parallelProcesses.includes(p.id) && 'bg-accent'
                                  )}
                                  onClick={() => toggleRuleProcess(process.id, p.id, 'parallelProcesses')}
                                >
                                  {p.name.slice(0, 8)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {otherProcesses.slice(0, 6).map((p) => (
                                <Badge
                                  key={p.id}
                                  variant={rule.sameWorkerProcesses.includes(p.id) ? 'default' : 'outline'}
                                  className={cn(
                                    'cursor-pointer text-xs',
                                    rule.sameWorkerProcesses.includes(p.id) && 'bg-success'
                                  )}
                                  onClick={() => toggleRuleProcess(process.id, p.id, 'sameWorkerProcesses')}
                                >
                                  {p.name.slice(0, 8)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Process Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Novo Processo</DialogTitle>
            <DialogDescription>
              Adicione um novo processo ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Processo</label>
              <Input
                value={newProcess.name}
                onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
                placeholder="Ex: PINTURA"
                className="industrial-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tempo Médio (minutos)</label>
              <Input
                type="number"
                value={newProcess.averageTimeMinutes}
                onChange={(e) => setNewProcess({ ...newProcess, averageTimeMinutes: parseInt(e.target.value) || 60 })}
                className="industrial-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddProcess} className="gradient-primary text-primary-foreground">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessesList;
