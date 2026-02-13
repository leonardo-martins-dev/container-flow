# Sistema de Grid Personalizável

Este sistema permite criar layouts de grid altamente personalizáveis e responsivos para sua aplicação React.

## Componentes Principais

### CustomGrid
Componente principal que renderiza o grid com configurações personalizadas.

### GridItem
Componente para itens individuais do grid, com suporte a áreas nomeadas.

### GridConfigurator
Interface visual para configurar o grid em tempo real.

## Como Usar

### 1. Uso Básico com Preset

```tsx
import { CustomGrid, GridItem } from '@/components/layout/CustomGrid';
import { getGridPreset } from '@/lib/grid-presets';

const config = getGridPreset('dashboard');

function MyComponent() {
  return (
    <CustomGrid config={config}>
      <GridItem>Conteúdo 1</GridItem>
      <GridItem>Conteúdo 2</GridItem>
      <GridItem>Conteúdo 3</GridItem>
    </CustomGrid>
  );
}
```

### 2. Configuração Personalizada

```tsx
const customConfig = {
  columns: 'repeat(3, 1fr)',
  rows: 'auto',
  gap: 24,
  responsive: {
    sm: { columns: 1, gap: 16 },
    md: { columns: 2, gap: 20 },
    lg: { columns: 3, gap: 24 },
  }
};

<CustomGrid config={customConfig}>
  {/* seus componentes */}
</CustomGrid>
```

### 3. Layout com Áreas Nomeadas

```tsx
const layoutConfig = {
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
</CustomGrid>
```

### 4. Usando o Hook de Configuração

```tsx
import { useGridConfig } from '@/hooks/use-grid-config';

function MyComponent() {
  const { config, updateConfig, updateResponsive } = useGridConfig(
    getGridPreset('dashboard')
  );

  const handleChangeLayout = () => {
    updateConfig({ 
      columns: 'repeat(4, 1fr)', 
      gap: 32 
    });
  };

  return (
    <div>
      <button onClick={handleChangeLayout}>Mudar Layout</button>
      <CustomGrid config={config}>
        {/* seus componentes */}
      </CustomGrid>
    </div>
  );
}
```

## Presets Disponíveis

- **dashboard**: Grid de 12 colunas responsivo, ideal para dashboards
- **cards**: Auto-fit com largura mínima, perfeito para cards
- **gallery**: Grid para galeria de imagens
- **sidebarContent**: Layout com sidebar fixa
- **fullLayout**: Layout completo com header, sidebar, conteúdo e footer
- **list**: Layout de lista simples
- **table**: Layout de tabela responsiva
- **custom**: Base para personalização

## Configuração do MainLayout

Para usar o grid no layout principal:

```tsx
// Layout tradicional (padrão)
<MainLayout />

// Layout com grid personalizado
<MainLayout 
  useGridLayout={true} 
  gridPreset="fullLayout" 
/>

// Layout com configuração customizada
<MainLayout 
  useGridLayout={true} 
  customGridConfig={myCustomConfig} 
/>
```

## Propriedades de Configuração

### GridConfig

```typescript
interface GridConfig {
  columns?: number | string;     // Definição das colunas
  rows?: number | string;        // Definição das linhas
  gap?: number | string;         // Espaçamento entre itens
  areas?: string[];              // Áreas nomeadas do grid
  responsive?: {                 // Configurações responsivas
    sm?: Partial<GridConfig>;
    md?: Partial<GridConfig>;
    lg?: Partial<GridConfig>;
    xl?: Partial<GridConfig>;
  };
}
```

### Exemplos de Valores

- **columns**: 
  - `3` → `repeat(3, 1fr)`
  - `'200px 1fr 200px'` → colunas fixas e flexível
  - `'repeat(auto-fit, minmax(250px, 1fr))'` → responsivo automático

- **gap**: 
  - `20` → `20px`
  - `'1rem'` → `1rem`
  - `'20px 10px'` → gap horizontal e vertical diferentes

## Dicas de Uso

1. **Performance**: Use presets quando possível, eles são otimizados
2. **Responsividade**: Sempre configure breakpoints para mobile
3. **Áreas**: Use áreas nomeadas para layouts complexos
4. **Flexibilidade**: Combine classes Tailwind com o sistema de grid
5. **Debug**: Use o GridConfigurator para testar configurações

## Exemplo Completo

Veja o arquivo `src/pages/GridDemo.tsx` para um exemplo completo com todas as funcionalidades.