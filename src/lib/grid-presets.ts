import { GridConfig } from '@/components/layout/CustomGrid';

export const gridPresets: Record<string, GridConfig> = {
  // Layout básico de dashboard
  dashboard: {
    columns: 'repeat(12, 1fr)',
    rows: 'auto',
    gap: 24,
    responsive: {
      sm: { columns: 1, gap: 16 },
      md: { columns: 'repeat(6, 1fr)', gap: 20 },
      lg: { columns: 'repeat(12, 1fr)', gap: 24 },
    },
  },

  // Layout de cards
  cards: {
    columns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20,
    responsive: {
      sm: { columns: 1, gap: 16 },
      md: { columns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18 },
      lg: { columns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 },
    },
  },

  // Layout de sidebar + conteúdo
  sidebarContent: {
    columns: '250px 1fr',
    rows: '1fr',
    gap: 0,
    areas: [
      'sidebar content'
    ],
    responsive: {
      sm: { 
        columns: '1fr',
        rows: 'auto 1fr',
        areas: ['sidebar', 'content']
      },
      lg: { 
        columns: '250px 1fr',
        rows: '1fr',
        areas: ['sidebar content']
      },
    },
  },

  // Layout de header + sidebar + conteúdo + footer
  fullLayout: {
    columns: '250px 1fr',
    rows: 'auto 1fr auto',
    gap: 0,
    areas: [
      'header header',
      'sidebar content',
      'footer footer'
    ],
    responsive: {
      sm: {
        columns: '1fr',
        rows: 'auto auto 1fr auto',
        areas: [
          'header',
          'sidebar',
          'content',
          'footer'
        ]
      },
      lg: {
        columns: '250px 1fr',
        rows: 'auto 1fr auto',
        areas: [
          'header header',
          'sidebar content',
          'footer footer'
        ]
      },
    },
  },

  // Layout de galeria
  gallery: {
    columns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
    responsive: {
      sm: { columns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 },
      md: { columns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 },
      lg: { columns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
    },
  },

  // Layout de lista
  list: {
    columns: '1fr',
    gap: 8,
    responsive: {
      sm: { gap: 6 },
      md: { gap: 8 },
    },
  },

  // Layout de tabela responsiva
  table: {
    columns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 1,
    responsive: {
      sm: { columns: '1fr', gap: 8 },
      md: { columns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 1 },
      lg: { columns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1 },
    },
  },

  // Layout customizável (base para personalização)
  custom: {
    columns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 20,
    responsive: {
      sm: { columns: 1, gap: 16 },
      md: { columns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 },
      lg: { columns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 },
    },
  },
};

export const getGridPreset = (presetName: keyof typeof gridPresets): GridConfig => {
  return gridPresets[presetName] || gridPresets.custom;
};