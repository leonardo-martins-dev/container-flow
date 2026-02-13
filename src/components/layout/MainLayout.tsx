import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { CustomGrid, GridItem } from './CustomGrid';
import { useGridConfig } from '@/hooks/use-grid-config';
import { getGridPreset } from '@/lib/grid-presets';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  gridPreset?: string;
  customGridConfig?: any;
  useGridLayout?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  gridPreset = 'fullLayout',
  customGridConfig,
  useGridLayout = false 
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const initialConfig = customGridConfig || getGridPreset(gridPreset);
  const { config, updateConfig } = useGridConfig(initialConfig);

  // Layout tradicional (atual)
  if (!useGridLayout) {
    return (
      <div className="min-h-screen bg-background">
        <AppSidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed} 
        />
        
        <motion.div
          initial={false}
          animate={{
            marginLeft: isSidebarCollapsed ? 72 : 260,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex flex-col min-h-screen"
        >
          <Header />
          
          <main className="flex-1 p-6 overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </main>
        </motion.div>
      </div>
    );
  }

  // Layout com grid personalizado
  return (
    <div className="min-h-screen bg-background">
      <CustomGrid config={config} className="min-h-screen">
        <GridItem area="header" className="col-span-full">
          <Header />
        </GridItem>
        
        <GridItem area="sidebar">
          <AppSidebar 
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed} 
          />
        </GridItem>
        
        <GridItem area="content" className="overflow-auto">
          <main className="p-6 h-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </main>
        </GridItem>
      </CustomGrid>
    </div>
  );
};
