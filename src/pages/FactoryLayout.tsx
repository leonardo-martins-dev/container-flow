import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Settings, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useContainerContext } from '@/contexts/ContainerContext';
import { FactoryGrid } from '@/components/factory/FactoryGrid';
import { ContainerPool } from '@/components/factory/ContainerPool';
import { cn } from '@/lib/utils';

const FactoryLayout: React.FC = () => {
  const {
    containers,
    processes,
    workers,
    factorySlots,
    factorySlots2,
    updateFactorySlots,
    updateFactorySlots2,
    assignContainerToSlot,
    removeContainerFromSlot,
  } = useContainerContext();

  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [editMode, setEditMode] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [draggedContainer, setDraggedContainer] = useState<number | null>(null);
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('factoryLayoutZoom');
    return saved ? parseFloat(saved) : 1;
  });

  // Save zoom to localStorage
  useEffect(() => {
    localStorage.setItem('factoryLayoutZoom', zoom.toString());
  }, [zoom]);

  // Get current floor data
  const currentSlots = activeFloor === 1 ? factorySlots : factorySlots2;
  const setCurrentSlots = activeFloor === 1 ? updateFactorySlots : updateFactorySlots2;

  // Get unassigned containers
  const unassignedContainers = containers.filter(container => {
    const inSlot1 = factorySlots.some(slot => slot.containerId === container.id);
    const inSlot2 = factorySlots2.some(slot => slot.containerId === container.id);
    return !inSlot1 && !inSlot2;
  });

  // Get assigned containers for current floor
  const assignedContainers = containers.filter(container => {
    return currentSlots.some(slot => slot.containerId === container.id);
  });

  // Calculate statistics
  const stats = {
    totalSlots: currentSlots.length,
    occupiedSlots: currentSlots.filter(slot => slot.containerId !== null).length,
    totalContainers: containers.length,
    unassignedContainers: unassignedContainers.length,
    utilizationRate: currentSlots.length > 0 
      ? Math.round((currentSlots.filter(slot => slot.containerId !== null).length / currentSlots.length) * 100)
      : 0,
  };

  const handleContainerAssign = (containerId: number, slotId: string) => {
    assignContainerToSlot(containerId, slotId, activeFloor);
  };

  const handleContainerRemove = (containerId: number) => {
    removeContainerFromSlot(containerId);
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  const handleContainerDragStart = (containerId: number) => {
    setDraggedContainer(containerId);
  };

  const handleContainerDragEnd = () => {
    setDraggedContainer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Layout da Fábrica</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a disposição dos containers na fábrica de forma inteligente
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className={editMode ? 'bg-primary text-primary-foreground' : ''}
          >
            <Settings className="w-4 h-4 mr-2" />
            {editMode ? 'Editando' : 'Editar Layout'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.totalSlots}</div>
              <p className="text-xs text-muted-foreground">Total de Vagas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.occupiedSlots}</div>
              <p className="text-xs text-muted-foreground">Vagas Ocupadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalContainers}</div>
              <p className="text-xs text-muted-foreground">Total Containers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.unassignedContainers}</div>
              <p className="text-xs text-muted-foreground">Não Alocados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.utilizationRate}%</div>
              <p className="text-xs text-muted-foreground">Taxa de Utilização</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="edit-mode" className="text-sm">Modo Edição</Label>
              <Switch
                id="edit-mode"
                checked={editMode}
                onCheckedChange={setEditMode}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="show-stats" className="text-sm">Estatísticas</Label>
              <Switch
                id="show-stats"
                checked={showStats}
                onCheckedChange={setShowStats}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ZoomOut className="w-4 h-4" />
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={0.5}
                max={2}
                step={0.1}
                className="w-24"
              />
              <ZoomIn className="w-4 h-4" />
              <Badge variant="outline" className="min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Factory Grid */}
        <div className="flex-1 min-w-0">
          <Tabs 
            value={activeFloor.toString()} 
            onValueChange={(v) => setActiveFloor(Number(v) as 1 | 2)}
            className="flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <TabsList className="glass">
                <TabsTrigger value="1" className="flex items-center gap-2">
                  Terreno 1
                  <Badge variant="secondary" className="text-xs">
                    {factorySlots.filter(s => s.containerId).length}/{factorySlots.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="2" className="flex items-center gap-2">
                  Terreno 2
                  <Badge variant="secondary" className="text-xs">
                    {factorySlots2.filter(s => s.containerId).length}/{factorySlots2.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Grid Container - grows vertically, no horizontal scroll */}
            <div className="w-full overflow-x-hidden">
              <div 
                className="w-full"
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: 'top left',
                  width: zoom > 1 ? `${100 / zoom}%` : '100%'
                }}
              >
                <TabsContent value="1" className="mt-0">
                  <FactoryGrid
                    slots={factorySlots}
                    containers={assignedContainers}
                    processes={processes}
                    workers={workers}
                    onSlotsChange={updateFactorySlots}
                    onContainerAssign={handleContainerAssign}
                    onContainerRemove={handleContainerRemove}
                    editMode={editMode}
                    floorId={1}
                    draggedContainer={draggedContainer}
                  />
                </TabsContent>

                <TabsContent value="2" className="mt-0">
                  <FactoryGrid
                    slots={factorySlots2}
                    containers={assignedContainers}
                    processes={processes}
                    workers={workers}
                    onSlotsChange={updateFactorySlots2}
                    onContainerAssign={handleContainerAssign}
                    onContainerRemove={handleContainerRemove}
                    editMode={editMode}
                    floorId={2}
                    draggedContainer={draggedContainer}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Container Pool - Fixed position */}
        <div className="w-80 flex-shrink-0">
          <ContainerPool
            containers={unassignedContainers}
            onContainerDragStart={handleContainerDragStart}
            onContainerDragEnd={handleContainerDragEnd}
            draggedContainer={draggedContainer}
            className="sticky top-0"
          />
        </div>
      </div>
    </div>
  );
};

export default FactoryLayout;
