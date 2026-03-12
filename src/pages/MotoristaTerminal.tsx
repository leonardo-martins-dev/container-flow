import React, { useState, useEffect } from 'react';
import { Car, Package, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTarefasMotorista } from '@/lib/api';

const MotoristaTerminal: React.FC = () => {
  const [tarefas, setTarefas] = useState<Array<{ id: number; tipo: string; containerId: number; data: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTarefasMotorista()
      .then(setTarefas)
      .catch(() => setTarefas([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Terminal Motorista</h1>
        <p className="text-muted-foreground mt-1">Suas tarefas de entrega, retirada e movimentação</p>
      </div>
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Tarefas atribuídas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : tarefas.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma tarefa no momento.</p>
          ) : (
            <ul className="space-y-4">
              {tarefas.map((t) => (
                <li key={t.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/50">
                  <Package className="w-8 h-8 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{t.tipo} — Container #{t.containerId}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {t.data}
                    </p>
                  </div>
                  <Badge>{t.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MotoristaTerminal;
