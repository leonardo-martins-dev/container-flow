import React, { useState } from 'react';
import { CustomGrid, GridItem, GridConfig } from '@/components/layout/CustomGrid';
import { GridConfigurator } from '@/components/layout/GridConfigurator';
import { GridLayoutExample } from '@/components/layout/GridLayoutExample';
import { getGridPreset } from '@/lib/grid-presets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const GridDemo: React.FC = () => {
  const [currentConfig, setCurrentConfig] = useState<GridConfig>(
    getGridPreset('dashboard')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Demo do Sistema de Grid</h1>
        <p className="text-muted-foreground mt-2">
          Experimente diferentes configurações de grid e veja o resultado em tempo real.
        </p>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList>
          <TabsTrigger value="demo">Demo Interativo</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
          <TabsTrigger value="docs">Documentação</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <GridConfigurator
              onConfigChange={setCurrentConfig}
              initialConfig={currentConfig}
            />

            <Card>
              <CardHeader>
                <CardTitle>Preview do Grid</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomGrid config={currentConfig} className="min-h-[300px] border-2 border-dashed border-border">
                  {Array.from({ length: 6 }, (_, i) => (
                    <GridItem key={i} className="bg-muted/50 border border-border rounded p-4 flex items-center justify-center">
                      <span className="text-sm font-medium">Item {i + 1}</span>
                    </GridItem>
                  ))}
                </CustomGrid>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="examples">
          <GridLayoutExample />
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Como Usar o Sistema de Grid</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Importar os Componentes</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`import { CustomGrid, GridItem } from '@/components/layout/CustomGrid';
import { useGridConfig } from '@/hooks/use-grid-config';
import { getGridPreset } from '@/lib/grid-presets';`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Usar um Preset</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`const config = getGridPreset('dashboard');

<CustomGrid config={config}>
  <GridItem>Conteúdo 1</GridItem>
  <GridItem>Conteúdo 2</GridItem>
</CustomGrid>`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Configuração Personalizada</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`const customConfig = {
  columns: 'repeat(3, 1fr)',
  gap: 24,
  responsive: {
    sm: { columns: 1, gap: 16 },
    md: { columns: 2, gap: 20 },
    lg: { columns: 3, gap: 24 },
  }
};`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Grid com Áreas Nomeadas</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`const layoutConfig = {
  columns: '250px 1fr',
  rows: 'auto 1fr auto',
  areas: [
    'header header',
    'sidebar content',
    'footer footer'
  ]
};

<CustomGrid config={layoutConfig}>
  <GridItem area="header">Header</GridItem>
  <GridItem area="sidebar">Sidebar</GridItem>
  <GridItem area="content">Content</GridItem>
  <GridItem area="footer">Footer</GridItem>
</CustomGrid>`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">5. Hook para Gerenciar Estado</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`const { config, updateConfig, updateResponsive } = useGridConfig(initialConfig);

// Atualizar configuração
updateConfig({ columns: 'repeat(4, 1fr)', gap: 32 });

// Atualizar responsivo
updateResponsive('md', { columns: 2, gap: 20 });`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presets Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">dashboard</h4>
                  <p className="text-sm text-muted-foreground">Grid de 12 colunas responsivo</p>
                </div>
                <div>
                  <h4 className="font-medium">cards</h4>
                  <p className="text-sm text-muted-foreground">Auto-fit com largura mínima</p>
                </div>
                <div>
                  <h4 className="font-medium">gallery</h4>
                  <p className="text-sm text-muted-foreground">Grid para galeria de imagens</p>
                </div>
                <div>
                  <h4 className="font-medium">sidebarContent</h4>
                  <p className="text-sm text-muted-foreground">Layout com sidebar fixa</p>
                </div>
                <div>
                  <h4 className="font-medium">fullLayout</h4>
                  <p className="text-sm text-muted-foreground">Layout completo com header/footer</p>
                </div>
                <div>
                  <h4 className="font-medium">list</h4>
                  <p className="text-sm text-muted-foreground">Layout de lista simples</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};