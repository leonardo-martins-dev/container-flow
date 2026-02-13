import React from 'react';
import { cn } from '@/lib/utils';

export interface GridConfig {
  columns?: number | string;
  rows?: number | string;
  gap?: number | string;
  areas?: string[];
  responsive?: {
    sm?: Partial<GridConfig>;
    md?: Partial<GridConfig>;
    lg?: Partial<GridConfig>;
    xl?: Partial<GridConfig>;
  };
}

interface CustomGridProps {
  config: GridConfig;
  children: React.ReactNode;
  className?: string;
}

export const CustomGrid: React.FC<CustomGridProps> = ({ 
  config, 
  children, 
  className 
}) => {
  const getGridStyles = (gridConfig: GridConfig) => {
    const styles: React.CSSProperties = {};
    
    if (gridConfig.columns) {
      styles.gridTemplateColumns = typeof gridConfig.columns === 'number' 
        ? `repeat(${gridConfig.columns}, 1fr)` 
        : gridConfig.columns;
    }
    
    if (gridConfig.rows) {
      styles.gridTemplateRows = typeof gridConfig.rows === 'number'
        ? `repeat(${gridConfig.rows}, 1fr)`
        : gridConfig.rows;
    }
    
    if (gridConfig.gap) {
      styles.gap = typeof gridConfig.gap === 'number' 
        ? `${gridConfig.gap}px` 
        : gridConfig.gap;
    }
    
    if (gridConfig.areas) {
      styles.gridTemplateAreas = gridConfig.areas
        .map(area => `"${area}"`)
        .join(' ');
    }
    
    return styles;
  };

  const getResponsiveClasses = () => {
    const classes: string[] = [];
    
    if (config.responsive?.sm) {
      const { columns, gap } = config.responsive.sm;
      if (columns) {
        classes.push(
          typeof columns === 'number' 
            ? `sm:grid-cols-${columns}` 
            : `sm:[grid-template-columns:${columns}]`
        );
      }
      if (gap) {
        classes.push(typeof gap === 'number' ? `sm:gap-${gap}` : `sm:[gap:${gap}]`);
      }
    }
    
    if (config.responsive?.md) {
      const { columns, gap } = config.responsive.md;
      if (columns) {
        classes.push(
          typeof columns === 'number' 
            ? `md:grid-cols-${columns}` 
            : `md:[grid-template-columns:${columns}]`
        );
      }
      if (gap) {
        classes.push(typeof gap === 'number' ? `md:gap-${gap}` : `md:[gap:${gap}]`);
      }
    }
    
    if (config.responsive?.lg) {
      const { columns, gap } = config.responsive.lg;
      if (columns) {
        classes.push(
          typeof columns === 'number' 
            ? `lg:grid-cols-${columns}` 
            : `lg:[grid-template-columns:${columns}]`
        );
      }
      if (gap) {
        classes.push(typeof gap === 'number' ? `lg:gap-${gap}` : `lg:[gap:${gap}]`);
      }
    }
    
    if (config.responsive?.xl) {
      const { columns, gap } = config.responsive.xl;
      if (columns) {
        classes.push(
          typeof columns === 'number' 
            ? `xl:grid-cols-${columns}` 
            : `xl:[grid-template-columns:${columns}]`
        );
      }
      if (gap) {
        classes.push(typeof gap === 'number' ? `xl:gap-${gap}` : `xl:[gap:${gap}]`);
      }
    }
    
    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        'grid',
        getResponsiveClasses(),
        className
      )}
      style={getGridStyles(config)}
    >
      {children}
    </div>
  );
};

// Componente para itens do grid com área específica
interface GridItemProps {
  area?: string;
  children: React.ReactNode;
  className?: string;
}

export const GridItem: React.FC<GridItemProps> = ({ 
  area, 
  children, 
  className 
}) => {
  return (
    <div
      className={cn(className)}
      style={area ? { gridArea: area } : undefined}
    >
      {children}
    </div>
  );
};