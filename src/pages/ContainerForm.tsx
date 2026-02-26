import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Save,
  ArrowLeft,
  Calendar,
  Container as ContainerIcon,
  User,
  Clock,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContainerContext } from '@/contexts/ContainerContext';
import { adjustDeadlineToBusinessHours, formatTime, cn } from '@/lib/utils';
import { ProcessStage, Container } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

const ContainerForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { containers, containerTypes, processes, workers, addContainer, updateContainer } = useContainerContext();

  const isEdit = id && id !== 'new';
  const existingContainer = isEdit ? containers.find(c => c.id === Number(id)) : null;

  const [formData, setFormData] = useState({
    number: '',
    type: '',
    cliente: '',
    deliveryDeadline: '',
  });
  const [selectedProcesses, setSelectedProcesses] = useState<number[]>([]);
  const [processWorkers, setProcessWorkers] = useState<Record<number, number[]>>({});
  const [manualDeadline, setManualDeadline] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingContainer) {
      setFormData({
        number: existingContainer.number,
        type: existingContainer.type,
        cliente: existingContainer.cliente,
        deliveryDeadline: existingContainer.deliveryDeadline.slice(0, 16),
      });
      setSelectedProcesses(existingContainer.processStages.map(s => s.processId));
      const workerMap: Record<number, number[]> = {};
      existingContainer.processStages.forEach(s => {
        workerMap[s.processId] = s.assignedWorkerIds;
      });
      setProcessWorkers(workerMap);
    }
  }, [existingContainer]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleDeadlineChange = (value: string) => {
    const adjusted = manualDeadline ? value : adjustDeadlineToBusinessHours(value);
    setFormData(prev => ({ ...prev, deliveryDeadline: adjusted }));
    setHasChanges(true);
  };

  const toggleProcess = (processId: number) => {
    setSelectedProcesses(prev => {
      if (prev.includes(processId)) {
        return prev.filter(id => id !== processId);
      }
      return [...prev, processId];
    });
    setHasChanges(true);
  };

  const toggleWorker = (processId: number, workerId: number) => {
    setProcessWorkers(prev => {
      const current = prev[processId] || [];
      if (current.includes(workerId)) {
        return { ...prev, [processId]: current.filter(id => id !== workerId) };
      }
      return { ...prev, [processId]: [...current, workerId] };
    });
    setHasChanges(true);
  };

  const getAvailableWorkers = (processId: number) => {
    return workers.filter(w => w.specialtyProcessIds.includes(processId));
  };

  const handleSave = async () => {
    if (!formData.number || !formData.type || !formData.deliveryDeadline) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const processStages: ProcessStage[] = selectedProcesses.map(processId => {
      const existingStage = existingContainer?.processStages.find(s => s.processId === processId);
      const process = processes.find(p => p.id === processId);
      
      return existingStage || {
        processId,
        assignedWorkerIds: processWorkers[processId] || [],
        scheduledStartTime: null,
        scheduledEndTime: null,
        actualStartTime: null,
        actualEndTime: null,
        estimatedDuration: process?.averageTimeMinutes || 60,
        elapsedTime: 0,
        status: 'pending' as const,
      };
    });

    const containerData = {
      number: formData.number,
      type: formData.type,
      cliente: formData.cliente,
      deliveryDeadline: new Date(formData.deliveryDeadline).toISOString(),
      startDate: existingContainer?.startDate || new Date().toISOString(),
      currentStatus: existingContainer?.currentStatus || 'pending' as const,
      processStages,
    };

    setSaving(true);
    try {
      if (isEdit && existingContainer) {
        await updateContainer(existingContainer.id, containerData);
        toast({
          title: 'Container atualizado',
          description: `${formData.number} foi atualizado com sucesso.`,
        });
      } else {
        await addContainer(containerData);
        toast({
          title: 'Container criado',
          description: `${formData.number} foi criado com sucesso.`,
        });
      }
      navigate('/containers');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: isEdit ? 'Erro ao atualizar' : 'Erro ao criar',
        description: e instanceof Error ? e.message : 'Erro ao salvar o container.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            {isEdit ? 'Editar Container' : 'Novo Container'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? `Editando ${formData.number}` : 'Cadastre um novo container'}
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ContainerIcon className="w-5 h-5 text-primary" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Número do Container *</Label>
              <Input
                id="number"
                placeholder="Ex: CONT-001"
                value={formData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                className="industrial-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger className="industrial-input">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="glass">
                  {containerTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                placeholder="Nome do cliente"
                value={formData.cliente}
                onChange={(e) => handleInputChange('cliente', e.target.value)}
                className="industrial-input"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="deadline">Prazo de Entrega *</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="manual"
                    checked={manualDeadline}
                    onCheckedChange={setManualDeadline}
                  />
                  <Label htmlFor="manual" className="text-xs text-muted-foreground">
                    Manual
                  </Label>
                </div>
              </div>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deliveryDeadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                className="industrial-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processes */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Processos
          </CardTitle>
          <CardDescription>
            Selecione os processos necessários para este container
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {processes.map((process) => {
              const isSelected = selectedProcesses.includes(process.id);
              const availableWorkers = getAvailableWorkers(process.id);
              const assignedWorkers = processWorkers[process.id] || [];

              return (
                <motion.div
                  key={process.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'p-3 rounded-lg border transition-all cursor-pointer',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/30'
                  )}
                  onClick={() => toggleProcess(process.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProcess(process.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{process.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(process.averageTimeMinutes)}
                      </p>
                      {isSelected && availableWorkers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {availableWorkers.map((worker) => (
                            <Badge
                              key={worker.id}
                              variant={assignedWorkers.includes(worker.id) ? 'default' : 'outline'}
                              className="text-xs cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWorker(process.id, worker.id);
                              }}
                            >
                              {worker.name.split(' ')[0]}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          {hasChanges && 'Alterações não salvas'}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Container')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContainerForm;
