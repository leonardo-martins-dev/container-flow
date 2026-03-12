import React, { useState, useEffect } from 'react';
import { Truck, Calendar, ListTodo, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSolicitacoesLogistica, createSolicitacaoLogistica } from '@/lib/api';
import { useContainerContext } from '@/contexts/ContainerContext';
import { toast } from '@/hooks/use-toast';

const Logistics: React.FC = () => {
  const { containers } = useContainerContext();
  const [solicitacoes, setSolicitacoes] = useState<Array<{ id: number; containerId: number; data: string; hora: string; tipo: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [newContainerId, setNewContainerId] = useState('');
  const [newData, setNewData] = useState('');
  const [newHora, setNewHora] = useState('08:00');
  const [newTipo, setNewTipo] = useState<'entrega' | 'retirada' | 'movimentacao'>('movimentacao');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getSolicitacoesLogistica()
      .then(setSolicitacoes)
      .catch(() => setSolicitacoes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleNovaSolicitacao = async () => {
    const cid = parseInt(newContainerId, 10);
    if (!newData || Number.isNaN(cid)) {
      toast({ title: 'Informe o container e a data', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await createSolicitacaoLogistica({
        containerId: cid,
        data: newData.slice(0, 10),
        hora: newHora || undefined,
        tipo: newTipo,
      });
      toast({ title: 'Solicitação criada' });
      setNewContainerId('');
      setNewData('');
      load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Erro ao criar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Logística</h1>
        <p className="text-muted-foreground mt-1">Calendário, solicitações e agenda de motoristas</p>
      </div>
      <Tabs defaultValue="solicitacoes" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="solicitacoes" className="gap-2">
            <ListTodo className="w-4 h-4" />
            Solicitações
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2">
            <Calendar className="w-4 h-4" />
            Calendário
          </TabsTrigger>
        </TabsList>
        <TabsContent value="solicitacoes" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Solicitações de Logística
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Líder informa container, data e hora; sistema gera a solicitação.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <Label>Container</Label>
                  <Select
                    value={newContainerId === '' ? '__empty__' : newContainerId}
                    onValueChange={(v) => setNewContainerId(v === '__empty__' ? '' : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">Selecione</SelectItem>
                      {containers.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.number}</SelectItem>
                      ))}
                      {containers.length === 0 && <SelectItem value="__none__" disabled>Nenhum container</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input type="date" value={newData} onChange={(e) => setNewData(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Hora</Label>
                  <Input type="time" value={newHora} onChange={(e) => setNewHora(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={newTipo} onValueChange={(v: 'entrega'|'retirada'|'movimentacao') => setNewTipo(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrega">Entrega</SelectItem>
                      <SelectItem value="retirada">Retirada</SelectItem>
                      <SelectItem value="movimentacao">Movimentação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleNovaSolicitacao} disabled={saving} className="gap-2">
                  <Plus className="w-4 h-4" /> Nova solicitação
                </Button>
              </div>
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : solicitacoes.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma solicitação cadastrada.</p>
              ) : (
                <ul className="space-y-2">
                  {solicitacoes.map((s) => (
                    <li key={s.id} className="flex justify-between items-center py-2 border-b border-border/50">
                      <span>Container #{s.containerId}</span>
                      <span className="text-muted-foreground">{s.data} às {s.hora || '-'}</span>
                      <span className="badge">{s.tipo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendario">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Calendário diário / semanal</CardTitle>
              <p className="text-sm text-muted-foreground">Entregas (prioridade 1), retiradas (2), movimentações internas (3).</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em breve: visão calendário com entregas, retiradas e movimentações.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Logistics;
