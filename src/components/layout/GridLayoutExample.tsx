import React from 'react';
import { CustomGrid, GridItem } from './CustomGrid';
import { useGridConfig } from '@/hooks/use-grid-config';
import { getGridPreset } from '@/lib/grid-presets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const GridLayoutExample: React.FC = () => {
  const { config, updateConfig } = useGridConfig(getGridPreset('dashboard'));

  const handlePresetChange = (presetName: string) => {
    const newConfig = getGridPreset(presetName);
    updateConfig(newConfig);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant="outline" 
          onClick={() => handlePresetChange('dashboard')}
        >
          Dashboard
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handlePresetChange('cards')}
        >
          Cards
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handlePresetChange('gallery')}
        >
          Galeria
        </Button>
        <Button 
          variant="outline" 
          onClick={() => updateConfig({ 
            columns: 'repeat(3, 1fr)', 
            gap: 32,
            responsive: {
              sm: { columns: 1, gap: 16 },
              md: { columns: 2, gap: 24 },
              lg: { columns: 3, gap: 32 },
            }
          })}
        >
          Custom 3 Colunas
        </Button>
      </div>

      <CustomGrid config={config} className="min-h-[400px]">
        <GridItem className="col-span-full md:col-span-6 lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Conteúdo do primeiro card</p>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem className="col-span-full md:col-span-6 lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Card 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Conteúdo do segundo card</p>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem className="col-span-full md:col-span-6 lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Card 3</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Conteúdo do terceiro card</p>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem className="col-span-full lg:col-span-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Card Grande</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Este card ocupa mais espaço no grid</p>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem className="col-span-full lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Card Lateral</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Card na lateral</p>
            </CardContent>
          </Card>
        </GridItem>
      </CustomGrid>
    </div>
  );
};