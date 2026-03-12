import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Container } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPrevisaoComercial } from '@/lib/api';

const PrevisaoComercial: React.FC = () => {
  const [previsoes, setPrevisoes] = useState<Array<{ containerId: number; numero: string; inicioPrevisto: string; fimPrevisto: string; entregaPrevista: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrevisaoComercial()
      .then(setPrevisoes)
      .catch(() => setPrevisoes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Previsão Comercial</h1>
        <p className="text-muted-foreground mt-1">Estimativa de início, fim e entrega por container (quando todos ocupados)</p>
      </div>
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Previsões de entrega
          </CardTitle>
          <p className="text-sm text-muted-foreground">Visão restrita: sem dados internos sensíveis.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : previsoes.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma previsão disponível no momento.</p>
          ) : (
            <div className="space-y-3">
              {previsoes.map((p) => (
                <div key={p.containerId} className="flex items-center gap-4 py-3 border-b border-border/50">
                  <Container className="w-8 h-8 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{p.numero}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Início: {p.inicioPrevisto} — Fim: {p.fimPrevisto}
                    </p>
                  </div>
                  <p className="text-sm font-medium">Entrega: {p.entregaPrevista}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrevisaoComercial;
