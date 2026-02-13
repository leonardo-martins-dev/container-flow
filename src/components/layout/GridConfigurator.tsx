import React, { useState } from 'react';
import { GridConfig } from './CustomGrid';
import { useGridConfig } from '@/hooks/use-grid-config';
import { getGridPreset, gridPresets } from '@/lib/grid-presets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GridConfiguratorProps {
  onConfigChange: (config: GridConfig) => void;
  initialConfig?: GridConfig;
}

export const GridConfigurator: React.FC<GridConfiguratorProps> = ({
  onConfigChange,
  initialConfig
}) => {
  const { config, updateConfig, updateResponsive, resetConfig } = useGridConfig(
    initialConfig || getGridPreset('custom')
  );

  const [customColumns, setCustomColumns] = useState(
    typeof config.columns === 'string' ? config.columns : '1fr'
  );
  const [customRows, setCustomRows] = useState(
    typeof config.rows === 'string' ? config.rows : 'auto'
  );
  const [customGap, setCustomGap] = useState(
    typeof config.gap === 'string' ? config.gap : '20px'
  );

  React.useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const handlePresetChange = (presetName: string) => {
    const newConfig = getGridPreset(presetName);
    updateConfig(newConfig);
    
    // Atualizar os inputs customizados
    setCustomColumns(typeof newConfig.columns === 'string' ? newConfig.columns : '1fr');
    setCustomRows(typeof newConfig.rows === 'string' ? newConfig.rows : 'auto');
    setCustomGap(typeof newConfig.gap === 'string' ? newConfig.gap : '20px');
  };

  const handleCustomUpdate = () => {
    updateConfig({
      columns: customColumns,
      rows: customRows,
      gap: customGap,
    });
  };

  const handleResponsiveUpdate = (
    breakpoint: keyof NonNullable<GridConfig['responsive']>,
    field: string,
    value: string
  ) => {
    updateResponsive(breakpoint, { [field]: value });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Configurador de Grid</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
            <TabsTrigger value="responsive">Responsivo</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(gridPresets).map((presetName) => (
                <Button
                  key={presetName}
                  variant="outline"
                  onClick={() => handlePresetChange(presetName)}
                  className="capitalize"
                >
                  {presetName}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="columns">Colunas</Label>
                <Input
                  id="columns"
                  value={customColumns}
                  onChange={(e) => setCustomColumns(e.target.value)}
                  placeholder="repeat(3, 1fr) ou 200px 1fr 200px"
                />
              </div>

              <div>
                <Label htmlFor="rows">Linhas</Label>
                <Input
                  id="rows"
                  value={customRows}
                  onChange={(e) => setCustomRows(e.target.value)}
                  placeholder="auto ou repeat(2, 1fr)"
                />
              </div>

              <div>
                <Label htmlFor="gap">Espaçamento</Label>
                <Input
                  id="gap"
                  value={customGap}
                  onChange={(e) => setCustomGap(e.target.value)}
                  placeholder="20px ou 1rem"
                />
              </div>

              <Button onClick={handleCustomUpdate} className="w-full">
                Aplicar Configuração
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="responsive" className="space-y-4">
            {(['sm', 'md', 'lg', 'xl'] as const).map((breakpoint) => (
              <Card key={breakpoint}>
                <CardHeader>
                  <CardTitle className="text-sm uppercase">{breakpoint}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label>Colunas</Label>
                    <Input
                      value={config.responsive?.[breakpoint]?.columns || ''}
                      onChange={(e) => handleResponsiveUpdate(breakpoint, 'columns', e.target.value)}
                      placeholder="Deixe vazio para herdar"
                    />
                  </div>
                  <div>
                    <Label>Espaçamento</Label>
                    <Input
                      value={config.responsive?.[breakpoint]?.gap || ''}
                      onChange={(e) => handleResponsiveUpdate(breakpoint, 'gap', e.target.value)}
                      placeholder="Deixe vazio para herdar"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={resetConfig} className="w-full">
            Resetar Configuração
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};