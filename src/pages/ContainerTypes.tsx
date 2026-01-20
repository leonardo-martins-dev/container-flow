import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Boxes,
  Ruler,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useContainerContext } from '@/contexts/ContainerContext';
import { ContainerType } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

const ContainerTypes: React.FC = () => {
  const { containerTypes, addContainerType, updateContainerType, deleteContainerType } = useContainerContext();
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<ContainerType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dimensions: '',
  });

  const handleOpenModal = (type?: ContainerType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description,
        dimensions: type.dimensions,
      });
    } else {
      setEditingType(null);
      setFormData({
        name: '',
        description: '',
        dimensions: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    if (editingType) {
      updateContainerType(editingType.id, formData);
      toast({ title: 'Tipo atualizado' });
    } else {
      addContainerType(formData);
      toast({ title: 'Tipo adicionado' });
    }

    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    deleteContainerType(id);
    toast({ title: 'Tipo removido' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Tipos de Containers</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os tipos de containers disponíveis
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {/* Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {containerTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="glass hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Boxes className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{type.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Ruler className="w-3 h-3" />
                        {type.dimensions}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenModal(type)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(type.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {containerTypes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Boxes className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Nenhum tipo cadastrado</h3>
          <p className="text-muted-foreground">Adicione tipos de containers para começar</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Editar Tipo' : 'Novo Tipo de Container'}
            </DialogTitle>
            <DialogDescription>
              {editingType ? 'Atualize as informações do tipo' : 'Cadastre um novo tipo de container'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: 40ft HC"
                className="industrial-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensões</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                placeholder="Ex: 40x8x9.5 ft"
                className="industrial-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do tipo de container"
                className="industrial-input"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
              {editingType ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContainerTypes;
