import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Container,
  GanttChart,
  Factory,
  Settings,
  Layers,
  Users,
  Boxes,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
  Truck,
  Car,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/lib/roles';

const allNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/containers', icon: Container, label: 'Containers' },
  { to: '/gantt', icon: GanttChart, label: 'Cronograma' },
  { to: '/layout', icon: Factory, label: 'Planta da Fábrica' },
  { to: '/processes', icon: Layers, label: 'Processos' },
  { to: '/workers', icon: Users, label: 'Trabalhadores' },
  { to: '/container-types', icon: Boxes, label: 'Tipos de Containers' },
  { to: '/logistics', icon: Truck, label: 'Logística' },
  { to: '/motorista', icon: Car, label: 'Terminal Motorista' },
  { to: '/comercial', icon: TrendingUp, label: 'Previsão Comercial' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { role, logout } = useAuth();
  const navItems = role ? allNavItems.filter((item) => canAccessRoute(role, item.to)) : allNavItems;
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem('sidebarPinned');
    return saved ? JSON.parse(saved) : true;
  });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarPinned', JSON.stringify(isPinned));
  }, [isPinned]);

  useEffect(() => {
    if (!isPinned && !isHovering) {
      const timer = setTimeout(() => {
        setIsCollapsed(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPinned, isHovering, setIsCollapsed]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (!isPinned) {
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const showFull = !isCollapsed || isHovering;

  return (
    <motion.aside
      initial={false}
      animate={{
        width: showFull ? 260 : 72,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'glass-strong border-r border-border/50',
        'flex flex-col'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
        <AnimatePresence mode="wait">
          {showFull ? (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <Container className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-gradient-primary">T.A.M. Miranda</span>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center"
            >
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <Container className="w-5 h-5 text-primary-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;

            const linkContent = (
              <NavLink
                to={item.to}
                className={cn(
                  'nav-item w-full',
                  isActive && 'nav-item-active'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
                <AnimatePresence mode="wait">
                  {showFull && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );

            if (!showFull) {
              return (
                <li key={item.to}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="glass">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return <li key={item.to}>{linkContent}</li>;
          })}
        </ul>
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-border/50 space-y-2">
        {showFull && (
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        )}
        <div className={cn('flex', showFull ? 'justify-between' : 'justify-center')}>
          {showFull && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPinned(!isPinned)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              <span className="ml-2">{isPinned ? 'Fixado' : 'Solto'}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
};
