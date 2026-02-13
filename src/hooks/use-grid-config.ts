import { useState, useCallback } from 'react';
import { GridConfig } from '@/components/layout/CustomGrid';

export const useGridConfig = (initialConfig: GridConfig) => {
  const [config, setConfig] = useState<GridConfig>(initialConfig);

  const updateConfig = useCallback((newConfig: Partial<GridConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig,
      responsive: {
        ...prev.responsive,
        ...newConfig.responsive,
      },
    }));
  }, []);

  const updateResponsive = useCallback((
    breakpoint: keyof NonNullable<GridConfig['responsive']>,
    responsiveConfig: Partial<GridConfig>
  ) => {
    setConfig(prev => ({
      ...prev,
      responsive: {
        ...prev.responsive,
        [breakpoint]: {
          ...prev.responsive?.[breakpoint],
          ...responsiveConfig,
        },
      },
    }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  return {
    config,
    updateConfig,
    updateResponsive,
    resetConfig,
  };
};