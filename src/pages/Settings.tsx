import React from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Clock,
  Database,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const handleClearData = () => {
    localStorage.clear();
    toast({
      title: 'Dados limpos',
      description: 'Recarregue a página para ver os dados iniciais.',
    });
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Personalize o sistema de acordo com suas preferências
        </p>
      </div>

      {/* Appearance */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Tema Escuro</Label>
              <p className="text-sm text-muted-foreground">
                O sistema usa tema escuro por padrão
              </p>
            </div>
            <Switch checked disabled />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure alertas e notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Alertas de Processos</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas quando processos estão próximos do fim
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="bg-border/50" />
          <div className="flex items-center justify-between">
            <div>
              <Label>Som de Alerta</Label>
              <p className="text-sm text-muted-foreground">
                Tocar som ao exibir alertas importantes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Horário de Trabalho
          </CardTitle>
          <CardDescription>
            Configurações de expediente padrão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Segunda a Quinta</p>
              <p className="text-lg font-mono text-primary">07:10 - 16:50</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Sexta-feira</p>
              <p className="text-lg font-mono text-primary">07:10 - 15:50</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-sm font-medium">Horário de Almoço</p>
            <p className="text-lg font-mono text-primary">12:00 - 13:00</p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Gerenciamento de Dados
          </CardTitle>
          <CardDescription>
            Gerencie os dados armazenados localmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Armazenamento Local</Label>
              <p className="text-sm text-muted-foreground">
                Dados são salvos no navegador
              </p>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar
            </Button>
          </div>
          <Separator className="bg-border/50" />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-destructive">Limpar Dados</Label>
              <p className="text-sm text-muted-foreground">
                Remove todos os dados e restaura os valores iniciais
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass">
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá remover todos os containers, configurações e layouts salvos.
                    Os dados serão restaurados para os valores iniciais. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData}>
                    Limpar Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            Sobre o Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Nome:</span> ContainerPro</p>
            <p><span className="text-muted-foreground">Versão:</span> 1.0.0</p>
            <p><span className="text-muted-foreground">Descrição:</span> Sistema de gerenciamento e rastreamento de modificações em contêineres de transporte marítimo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
