import React, { useState, useEffect } from 'react';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useContainerContext } from '@/contexts/ContainerContext';

export const Header: React.FC = () => {
  const { alerts, dismissAlert } = useContainerContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-16 glass-strong border-b border-border/50 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar container, processo..."
            className="w-80 pl-10 industrial-input"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        {/* Clock */}
        <div className="text-right">
          <div className="text-lg font-mono font-bold text-primary">{formattedTime}</div>
          <div className="text-xs text-muted-foreground capitalize">{formattedDate}</div>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs gradient-primary text-primary-foreground"
                >
                  {alerts.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass">
            {alerts.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">Sem alertas pendentes</span>
              </DropdownMenuItem>
            ) : (
              alerts.map((alert) => (
                <DropdownMenuItem
                  key={alert.id}
                  onClick={() => dismissAlert(alert.id)}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <span className="font-medium text-warning">{alert.containerNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {alert.processName} - {alert.workerName}
                  </span>
                  <span className="text-xs text-destructive">
                    {alert.remainingMinutes} min restantes
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
