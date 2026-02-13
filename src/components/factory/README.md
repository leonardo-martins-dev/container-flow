# Sistema de Grid de Fábrica

Sistema completo para gerenciamento visual do layout de containers na fábrica.

## Componentes Principais

### FactoryGrid
Grid inteligente e responsivo para disposição de containers na fábrica.

**Características:**
- Grid configurável (colunas x linhas)
- Drag & drop nativo
- Redimensionamento automático
- Animações suaves
- Modo de edição
- Posicionamento automático

### ContainerPool
Painel lateral para gerenciar containers não alocados.

**Funcionalidades:**
- Busca por número, cliente ou tipo
- Filtros por status (pendente, em progresso, urgente)
- Ordenação por prazo, progresso, tipo ou cliente
- Indicadores visuais de urgência
- Drag & drop para o grid

### ProcessIndicator
Indicador visual do processo ativo em cada container.

**Informações Exibidas:**
- Nome do processo atual
- Progresso em tempo real
- Tempo restante
- Trabalhador responsável
- Alertas de atraso

## Como Usar

### 1. Configuração Básica

```tsx
import { FactoryGrid } from '@/components/factory/FactoryGrid';
import { ContainerPool } from '@/components/factory/ContainerPool';

<FactoryGrid
  slots={factorySlots}
  containers={containers}
  processes={processes}
  workers={workers}
  onSlotsChange={updateSlots}
  onContainerAssign={handleAssign}
  onContainerRemove={handleRemove}
  editMode={editMode}
  floorId={1}
/>
```

### 2. Modo de Edição

No modo de edição você pode:
- **Adicionar colunas/linhas**: Botões Col+/Row+
- **Remover colunas/linhas**: Botões Col-/Row-
- **Limpar tudo**: Remove todos os containers

### 3. Drag & Drop

- **Arrastar containers**: Do painel lateral para o grid
- **Mover containers**: Entre vagas no grid
- **Remover containers**: Botão de lixeira em cada vaga

### 4. Filtros e Busca

No ContainerPool:
- **Busca**: Por número, cliente ou tipo
- **Filtros**: Todos, Pendentes, Em Progresso, Urgentes
- **Ordenação**: Prazo, Progresso, Tipo, Cliente

## Configurações do Grid

### Grid Padrão
- **Colunas**: 4
- **Linhas**: 3
- **Espaçamento**: 16px
- **Tamanho da célula**: 240x160px
- **Auto-redimensionamento**: Ativo

### Personalização
```tsx
const customConfig = {
  columns: 6,
  rows: 4,
  gap: 20,
  cellWidth: 280,
  cellHeight: 180,
  autoResize: true,
};
```

## Estados dos Containers

### Cores de Status
- **Verde**: Container em progresso normal
- **Amarelo**: Processo próximo do prazo
- **Vermelho**: Processo atrasado
- **Cinza**: Sem processo ativo

### Indicadores
- **Progresso**: Barra de progresso visual
- **Prazo**: Dias restantes até entrega
- **Processo**: Nome do processo ativo
- **Trabalhador**: Responsável atual

## Responsividade

O sistema se adapta automaticamente:
- **Desktop**: Grid completo com painel lateral
- **Tablet**: Grid reduzido, painel colapsável
- **Mobile**: Grid em coluna única

## Performance

### Otimizações
- **Memoização**: Componentes otimizados com React.memo
- **Lazy Loading**: Carregamento sob demanda
- **Animações**: GPU-accelerated com Framer Motion
- **Virtual Scrolling**: Para listas grandes

### Limites Recomendados
- **Máximo de containers**: 100 por terreno
- **Máximo de vagas**: 50 por terreno
- **Atualização**: Tempo real (1 segundo)

## Integração

### Context Required
```tsx
const {
  containers,
  processes,
  workers,
  factorySlots,
  updateFactorySlots,
  assignContainerToSlot,
  removeContainerFromSlot,
} = useContainerContext();
```

### Dados Necessários
- **Containers**: Lista com processStages
- **Processes**: Lista de processos disponíveis
- **Workers**: Lista de trabalhadores
- **FactorySlots**: Vagas da fábrica

## Troubleshooting

### Problemas Comuns

1. **Containers não aparecem**
   - Verificar se containerId está correto
   - Confirmar que container existe na lista

2. **Drag & drop não funciona**
   - Verificar se editMode está false
   - Confirmar handlers de drag

3. **Grid não redimensiona**
   - Verificar autoResize está true
   - Confirmar configuração do grid

4. **Performance lenta**
   - Reduzir número de containers
   - Desabilitar animações se necessário

### Debug
```tsx
// Ativar logs de debug
localStorage.setItem('factory-debug', 'true');
```

## Exemplos

### Grid 3x2 Simples
```tsx
<FactoryGrid
  slots={slots}
  containers={containers}
  processes={processes}
  workers={workers}
  editMode={false}
  floorId={1}
/>
```

### Com Controles Personalizados
```tsx
<div className="space-y-4">
  <GridControls onConfigChange={handleConfigChange} />
  <FactoryGrid {...props} />
  <ContainerPool {...poolProps} />
</div>
```