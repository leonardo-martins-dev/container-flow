import React, { useState, useEffect } from 'react';
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
  Search,
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
import { getRegrasValidar, putRegras } from '@/lib/api';
import type { SequencingRule } from '@/data/mockData';

const ProcessesList: React.FC = () => {
  const { processes, workers, sequencingRules, addProcess, updateProcess, deleteProcess, updateSequencingRule, setSequencingRules, loadRegrasFromApi } = useContainerContext();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTime, setEditTime] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showWorkersModal, setShowWorkersModal] = useState(false);
  const [selectedProcessWorkers, setSelectedProcessWorkers] = useState<{ process: any; workers: any[] }>({ process: null, workers: [] });
  const [newProcess, setNewProcess] = useState({ name: '', averageTimeMinutes: 60 });
  const [validando, setValidando] = useState(false);
  const [validacaoResult, setValidacaoResult] = useState<{ ok: boolean; erros: string[] } | null>(null);
  const [regrasLoaded, setRegrasLoaded] = useState(false);

  useEffect(() => {
    loadRegrasFromApi().then(() => setRegrasLoaded(true)).catch(() => {
      toast({ title: 'Não foi possível carregar regras da API.', variant: 'destructive' });
      setRegrasLoaded(true);
    });
  }, [loadRegrasFromApi]);

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

  const handleShowWorkers = (process: any) => {
    const processWorkers = getWorkersForProcess(process.id);
    setSelectedProcessWorkers({ process, workers: processWorkers });
    setShowWorkersModal(true);
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

  const toggleRuleProcess = async (ruleProcessId: number, targetProcessId: number, field: keyof SequencingRule) => {
    const rule = getRule(ruleProcessId);
    const currentList = (rule[field] as number[]) || [];
    const newList = currentList.includes(targetProcessId)
      ? currentList.filter(id => id !== targetProcessId)
      : [...currentList, targetProcessId];

    const byProcessId: Record<number, SequencingRule> = {};
    sequencingRules.forEach(r => { byProcessId[r.processId] = { ...r }; });
    if (!byProcessId[ruleProcessId]) {
      byProcessId[ruleProcessId] = {
        processId: ruleProcessId,
        beforeProcesses: [],
        afterProcesses: [],
        parallelProcesses: [],
        separatedProcesses: [],
        sameWorkerProcesses: [],
        requiresSeniorJunior: false,
      };
    }
    byProcessId[ruleProcessId] = { ...byProcessId[ruleProcessId], [field]: newList };

    if (field === 'beforeProcesses') {
      const targetRule = getRule(targetProcessId);
      const targetAfter = targetRule.afterProcesses.includes(ruleProcessId)
        ? targetRule.afterProcesses
        : [...targetRule.afterProcesses, ruleProcessId];
      if (!byProcessId[targetProcessId]) byProcessId[targetProcessId] = { ...targetRule };
      byProcessId[targetProcessId] = { ...byProcessId[targetProcessId], afterProcesses: newList.includes(targetProcessId) ? targetAfter : byProcessId[targetProcessId].afterProcesses.filter(id => id !== ruleProcessId) };
    } else if (field === 'afterProcesses') {
      const targetRule = getRule(targetProcessId);
      const targetBefore = targetRule.beforeProcesses.includes(ruleProcessId)
        ? targetRule.beforeProcesses
        : [...targetRule.beforeProcesses, ruleProcessId];
      if (!byProcessId[targetProcessId]) byProcessId[targetProcessId] = { ...targetRule };
      byProcessId[targetProcessId] = { ...byProcessId[targetProcessId], beforeProcesses: newList.includes(targetProcessId) ? targetBefore : byProcessId[targetProcessId].beforeProcesses.filter(id => id !== ruleProcessId) };
    } else if (field === 'parallelProcesses') {
      const targetRule = getRule(targetProcessId);
      const targetParallel = newList.includes(targetProcessId)
        ? [...new Set([...targetRule.parallelProcesses, ruleProcessId])]
        : targetRule.parallelProcesses.filter(id => id !== ruleProcessId);
      if (!byProcessId[targetProcessId]) byProcessId[targetProcessId] = { ...targetRule };
      byProcessId[targetProcessId] = { ...byProcessId[targetProcessId], parallelProcesses: targetParallel };
    } else if (field === 'sameWorkerProcesses') {
      const targetRule = getRule(targetProcessId);
      const targetSame = newList.includes(targetProcessId)
        ? [...new Set([...targetRule.sameWorkerProcesses, ruleProcessId])]
        : targetRule.sameWorkerProcesses.filter(id => id !== ruleProcessId);
      if (!byProcessId[targetProcessId]) byProcessId[targetProcessId] = { ...targetRule };
      byProcessId[targetProcessId] = { ...byProcessId[targetProcessId], sameWorkerProcesses: targetSame };
    } else if (field === 'separatedProcesses') {
      const targetRule = getRule(targetProcessId);
      const targetSep = newList.includes(targetProcessId)
        ? [...new Set([...targetRule.separatedProcesses, ruleProcessId])]
        : targetRule.separatedProcesses.filter(id => id !== ruleProcessId);
      if (!byProcessId[targetProcessId]) byProcessId[targetProcessId] = { ...targetRule };
      byProcessId[targetProcessId] = { ...byProcessId[targetProcessId], separatedProcesses: targetSep };
    }

    const updatedRules = Object.values(byProcessId);
    setSequencingRules(updatedRules);
    try {
      await putRegras(updatedRules);
    } catch (e) {
      toast({ title: 'Erro ao salvar regras na API.', variant: 'destructive' });
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
          {/* Botão Novo Processo apenas na aba de processos */}
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowNewModal(true)} className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          </div>
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
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                              onClick={() => handleShowWorkers(process)}
                            >
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <Badge variant="outline">{processWorkers.length}</Badge>
                              <span className="text-xs text-muted-foreground ml-1">ver detalhes</span>
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
          <div className="grid gap-6">
            {/* Header explicativo */}
            <Card className="glass border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Regras de Sequenciamento
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure as dependências entre processos de forma visual e intuitiva. 
                  Clique nos badges para ativar/desativar as regras.
                </CardDescription>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={validando}
                    onClick={async () => {
                      setValidando(true);
                      setValidacaoResult(null);
                      try {
                        const res = await getRegrasValidar();
                        setValidacaoResult(res);
                        toast({ title: res.ok ? 'Todas as regras estão consistentes.' : 'Inconsistências encontradas.', variant: res.ok ? 'default' : 'destructive' });
                      } catch (e) {
                        toast({ title: 'Erro ao validar regras.', variant: 'destructive' });
                        setValidacaoResult({ ok: false, erros: [e instanceof Error ? e.message : 'Erro desconhecido'] });
                      } finally {
                        setValidando(false);
                      }
                    }}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Validar Todas as Regras
                  </Button>
                  {validacaoResult && (
                    <div className={cn('mt-2 text-sm', validacaoResult.ok ? 'text-green-600' : 'text-destructive')}>
                      {validacaoResult.ok ? 'Todas as regras estão sincronizadas.' : validacaoResult.erros?.length ? validacaoResult.erros.map((e, i) => <div key={i}>{e}</div>) : null}
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Grid de processos */}
            <div className="grid gap-4">
              {processes.map((process) => {
                const rule = getRule(process.id);
                const otherProcesses = processes.filter(p => p.id !== process.id);

                return (
                  <motion.div
                    key={process.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: processes.indexOf(process) * 0.05 }}
                  >
                    <Card className="glass hover:shadow-md transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            {process.name}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {formatTime(process.averageTimeMinutes)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Depois de (Dependências) */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <label className="text-sm font-medium text-primary">
                              Deve executar DEPOIS de:
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-md bg-primary/10 border border-primary/20">
                            {otherProcesses.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Nenhum processo disponível</span>
                            ) : (
                              otherProcesses.map((p) => (
                                <Badge
                                  key={p.id}
                                  variant={rule.afterProcesses.includes(p.id) ? 'default' : 'outline'}
                                  className={cn(
                                    'cursor-pointer text-xs transition-all hover:scale-105',
                                    rule.afterProcesses.includes(p.id) 
                                      ? 'bg-primary hover:bg-primary/80 text-primary-foreground' 
                                      : 'hover:bg-primary/20'
                                  )}
                                  onClick={() => toggleRuleProcess(process.id, p.id, 'afterProcesses')}
                                >
                                  {p.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Paralelo com */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent"></div>
                            <label className="text-sm font-medium text-accent-foreground">
                              Pode executar em PARALELO com:
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-md bg-accent/10 border border-accent/20">
                            {otherProcesses.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Nenhum processo disponível</span>
                            ) : (
                              otherProcesses.map((p) => (
                                <Badge
                                  key={p.id}
                                  variant={rule.parallelProcesses.includes(p.id) ? 'default' : 'outline'}
                                  className={cn(
                                    'cursor-pointer text-xs transition-all hover:scale-105',
                                    rule.parallelProcesses.includes(p.id) 
                                      ? 'bg-accent hover:bg-accent/80 text-accent-foreground' 
                                      : 'hover:bg-accent/20'
                                  )}
                                  onClick={() => toggleRuleProcess(process.id, p.id, 'parallelProcesses')}
                                >
                                  {p.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Mesmo trabalhador */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-warning"></div>
                            <label className="text-sm font-medium text-foreground">
                              Deve usar o MESMO TRABALHADOR que:
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-md bg-warning/10 border border-warning/20">
                            {otherProcesses.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Nenhum processo disponível</span>
                            ) : (
                              otherProcesses.map((p) => (
                                <Badge
                                  key={p.id}
                                  variant={rule.sameWorkerProcesses.includes(p.id) ? 'default' : 'outline'}
                                  className={cn(
                                    'cursor-pointer text-xs transition-all hover:scale-105',
                                    rule.sameWorkerProcesses.includes(p.id) 
                                      ? 'bg-warning hover:bg-warning/80 text-warning-foreground' 
                                      : 'hover:bg-warning/20'
                                  )}
                                  onClick={() => toggleRuleProcess(process.id, p.id, 'sameWorkerProcesses')}
                                >
                                  {p.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Resumo das regras ativas */}
                        {(rule.afterProcesses.length > 0 || rule.parallelProcesses.length > 0 || rule.sameWorkerProcesses.length > 0) && (
                          <div className="pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {rule.afterProcesses.length + rule.parallelProcesses.length + rule.sameWorkerProcesses.length} regras ativas
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Legenda */}
            <Card className="glass border-muted">
              <CardContent className="pt-4">
                <div className="flex items-center justify-center gap-8 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Dependência (depois de)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <span>Paralelo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                    <span>Mesmo trabalhador</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Workers Modal */}
      <Dialog open={showWorkersModal} onOpenChange={setShowWorkersModal}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Trabalhadores - {selectedProcessWorkers.process?.name}
            </DialogTitle>
            <DialogDescription>
              Trabalhadores especializados neste processo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProcessWorkers.workers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum trabalhador especializado neste processo
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {selectedProcessWorkers.workers.map((worker) => (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {worker.level === 'senior' ? 'Sênior' : 'Júnior'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={worker.level === 'senior' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {worker.level === 'senior' ? 'Sênior' : 'Júnior'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {worker.specialtyProcessIds.length} especialidades
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkersModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
