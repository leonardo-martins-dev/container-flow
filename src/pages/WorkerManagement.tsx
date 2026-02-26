import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  User,
  Crown,
  Briefcase,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContainerContext } from '@/contexts/ContainerContext';
import { getWorkerColor, Worker } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const WorkerManagement: React.FC = () => {
  const { workers, processes, addWorker, updateWorker, deleteWorker } = useContainerContext();
  const [filterProcess, setFilterProcess] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 'junior' as 'junior' | 'senior',
    specialtyProcessIds: [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredWorkers = filterProcess === 'all'
    ? workers
    : workers.filter(w => w.specialtyProcessIds.includes(parseInt(filterProcess)));

  const handleOpenModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setFormData({
        name: worker.name,
        level: worker.level,
        specialtyProcessIds: [...worker.specialtyProcessIds],
      });
    } else {
      setEditingWorker(null);
      setFormData({
        name: '',
        level: 'junior',
        specialtyProcessIds: [],
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingWorker) {
        await updateWorker(editingWorker.id, formData);
        toast({ title: 'Trabalhador atualizado' });
      } else {
        await addWorker(formData);
        toast({ title: 'Trabalhador adicionado' });
      }
      setShowModal(false);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (processId: number) => {
    setFormData(prev => ({
      ...prev,
      specialtyProcessIds: prev.specialtyProcessIds.includes(processId)
        ? prev.specialtyProcessIds.filter(id => id !== processId)
        : [...prev.specialtyProcessIds, processId],
    }));
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteWorker(id);
      toast({ title: 'Trabalhador removido' });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Erro ao remover', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Trabalhadores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a equipe e suas especialidades
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Novo Trabalhador
        </Button>
      </div>

      {/* Filter */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterProcess} onValueChange={setFilterProcess}>
              <SelectTrigger className="w-64 industrial-input">
                <SelectValue placeholder="Filtrar por processo" />
              </SelectTrigger>
              <SelectContent className="glass">
                <SelectItem value="all">Todos os processos</SelectItem>
                {processes.map((process) => (
                  <SelectItem key={process.id} value={process.id.toString()}>
                    {process.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredWorkers.length} trabalhador{filteredWorkers.length !== 1 && 'es'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker, index) => {
          const workerProcesses = processes.filter(p => worker.specialtyProcessIds.includes(p.id));

          return (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass hover:border-primary/30 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg"
                        style={{ backgroundColor: getWorkerColor(worker.id) }}
                      >
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{worker.name}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            'mt-1',
                            worker.level === 'senior' ? 'border-warning text-warning' : 'border-accent text-accent'
                          )}
                        >
                          {worker.level === 'senior' ? (
                            <Crown className="w-3 h-3 mr-1" />
                          ) : (
                            <Briefcase className="w-3 h-3 mr-1" />
                          )}
                          {worker.level === 'senior' ? 'Sênior' : 'Júnior'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenModal(worker)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(worker.id)}
                        className="text-destructive hover:text-destructive"
                        disabled={deletingId === worker.id}
                      >
                        {deletingId === worker.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Especialidades ({workerProcesses.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {workerProcesses.slice(0, 6).map((process) => (
                        <Badge key={process.id} variant="secondary" className="text-xs">
                          {process.name}
                        </Badge>
                      ))}
                      {workerProcesses.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{workerProcesses.length - 6}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredWorkers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Nenhum trabalhador encontrado</h3>
          <p className="text-muted-foreground">
            {filterProcess !== 'all' ? 'Tente outro filtro' : 'Adicione trabalhadores para começar'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingWorker ? 'Editar Trabalhador' : 'Novo Trabalhador'}
            </DialogTitle>
            <DialogDescription>
              {editingWorker ? 'Atualize as informações do trabalhador' : 'Adicione um novo membro à equipe'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                className="industrial-input"
              />
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label>Nível</Label>
              <RadioGroup
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value as 'junior' | 'senior' })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="junior" id="junior" />
                  <Label htmlFor="junior" className="flex items-center gap-2 cursor-pointer">
                    <Briefcase className="w-4 h-4 text-accent" />
                    Júnior
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="senior" id="senior" />
                  <Label htmlFor="senior" className="flex items-center gap-2 cursor-pointer">
                    <Crown className="w-4 h-4 text-warning" />
                    Sênior
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Specialties */}
            <div className="space-y-2">
              <Label>Especialidades</Label>
              <ScrollArea className="h-48 border border-border/50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  {processes.map((process) => (
                    <div
                      key={process.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                        formData.specialtyProcessIds.includes(process.id)
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/30'
                      )}
                      onClick={() => toggleSpecialty(process.id)}
                    >
                      <Checkbox
                        checked={formData.specialtyProcessIds.includes(process.id)}
                        onCheckedChange={() => toggleSpecialty(process.id)}
                      />
                      <span className="text-sm truncate">{process.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {formData.specialtyProcessIds.length} processos selecionados
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground" disabled={saving}>
              {saving ? 'Salvando...' : editingWorker ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkerManagement;
