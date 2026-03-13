import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  UserCircle2,
  Shield,
  Mail,
  KeyRound,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { createUser, getUsers, updateUser, updateUserPassword, type UserRow } from '@/lib/api';

const rolesOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'lider', label: 'Líder' },
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'lider'>('all');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: 'lider' as 'admin' | 'lider',
    ativo: true,
    senha: '',
  });

  const [passwordModalUser, setPasswordModalUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (filterRole !== 'all') {
      list = list.filter((u) => u.role === filterRole);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.nome.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [users, filterRole, search]);

  const handleOpenModal = (user?: UserRow) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nome: user.nome,
        email: user.email,
        role: (user.role as 'admin' | 'lider') || 'lider',
        ativo: !!user.ativo,
        senha: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome: '',
        email: '',
        role: 'lider',
        ativo: true,
        senha: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      toast({ title: 'Nome e email são obrigatórios', variant: 'destructive' });
      return;
    }
    if (!editingUser && !formData.senha.trim()) {
      toast({ title: 'Senha é obrigatória para novo usuário', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          role: formData.role,
          ativo: formData.ativo,
        });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        toast({ title: 'Usuário atualizado' });
      } else {
        const created = await createUser({
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          role: formData.role,
          senha: formData.senha.trim(),
          ativo: formData.ativo,
        });
        setUsers((prev) => [...prev, created]);
        toast({ title: 'Usuário criado' });
      }
      setShowModal(false);
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Erro ao salvar usuário',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (user: UserRow) => {
    try {
      const updated = await updateUser(user.id, {
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: !user.ativo,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast({
        title: updated.ativo ? 'Usuário reativado' : 'Usuário desativado',
      });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Erro ao atualizar usuário',
        variant: 'destructive',
      });
    }
  };

  const handleOpenPasswordModal = (user: UserRow) => {
    setPasswordModalUser(user);
    setNewPassword('');
  };

  const handleSavePassword = async () => {
    if (!passwordModalUser) return;
    if (!newPassword.trim()) {
      toast({ title: 'Informe a nova senha', variant: 'destructive' });
      return;
    }
    setPasswordSaving(true);
    try {
      await updateUserPassword(passwordModalUser.id, newPassword.trim());
      toast({ title: 'Senha atualizada com sucesso' });
      setPasswordModalUser(null);
      setNewPassword('');
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Erro ao atualizar senha',
        variant: 'destructive',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Cadastre e gerencie os usuários e níveis de acesso do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Recarregar'}
          </Button>
          <Button
            onClick={() => handleOpenModal()}
            className="gradient-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      <Card className="glass">
        <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="industrial-input"
            />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground">Papel</Label>
            <Select
              value={filterRole}
              onValueChange={(value) => setFilterRole(value as 'all' | 'admin' | 'lider')}
            >
              <SelectTrigger className="w-48 industrial-input">
                <SelectValue placeholder="Filtrar por papel" />
              </SelectTrigger>
              <SelectContent className="glass">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="lider">Líderes</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredUsers.length} usuário{filteredUsers.length !== 1 && 's'}
            </span>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-260px)] pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="glass hover:border-primary/30 transition-all">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user.nome}</h3>
                          {!user.ativo && (
                            <Badge variant="outline" className="border-destructive text-destructive">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{user.email}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs flex items-center gap-1',
                              user.role === 'admin'
                                ? 'border-warning text-warning'
                                : 'border-accent text-accent',
                            )}
                          >
                            <Shield className="w-3 h-3" />
                            {user.role === 'admin' ? 'Administrador' : 'Líder'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenModal(user)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenPasswordModal(user)}
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          user.ativo ? 'text-destructive hover:text-destructive' : 'text-muted-foreground',
                        )}
                        onClick={() => handleToggleAtivo(user)}
                      >
                        {user.ativo ? (
                          <ToggleLeft className="w-4 h-4" />
                        ) : (
                          <ToggleRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {!loading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <UserCircle2 className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Nenhum usuário encontrado</p>
            <p className="text-sm mt-1">
              Ajuste os filtros ou cadastre um novo usuário.
            </p>
          </div>
        )}
      </ScrollArea>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Atualize os dados de acesso deste usuário.'
                : 'Defina os dados e o papel do novo usuário.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
                className="industrial-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
                className="industrial-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Papel</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value as 'admin' | 'lider' }))
                }
              >
                <SelectTrigger className="industrial-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rolesOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground">
                  Usuários inativos não conseguem fazer login.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData((prev) => ({ ...prev, ativo: !prev.ativo }))}
                className={cn(
                  'flex items-center gap-2',
                  formData.ativo ? '' : 'text-muted-foreground',
                )}
              >
                {formData.ativo ? (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    Ativo
                  </>
                ) : (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    Inativo
                  </>
                )}
              </Button>
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="senha">Senha inicial</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Defina uma senha temporária"
                  className="industrial-input"
                />
                <p className="text-xs text-muted-foreground">
                  Recomende que o usuário altere a senha no primeiro acesso.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="gradient-primary text-primary-foreground"
              disabled={saving}
            >
              {saving ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!passwordModalUser}
        onOpenChange={(open) => !open && setPasswordModalUser(null)}
      >
        <DialogContent className="glass max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              {passwordModalUser && `Defina uma nova senha para ${passwordModalUser.nome}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordModalUser(null)}
              disabled={passwordSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePassword}
              className="gradient-primary text-primary-foreground"
              disabled={passwordSaving}
            >
              {passwordSaving ? 'Salvando...' : 'Atualizar senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

