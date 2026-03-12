export type Role = 'admin' | 'lider' | 'logistica' | 'motorista' | 'comercial' | 'chao_tv';

export const ROLES: Role[] = ['admin', 'lider', 'logistica', 'motorista', 'comercial', 'chao_tv'];

const ADMIN_ROUTES = ['/', '/containers', '/container', '/gantt', '/layout', '/processes', '/workers', '/container-types', '/logistics', '/motorista', '/comercial', '/settings'];
const LIDER_ROUTES = ['/', '/containers', '/container', '/gantt', '/layout', '/processes', '/workers', '/container-types', '/logistics', '/comercial'];
const LOGISTICA_ROUTES = ['/logistics'];
const MOTORISTA_ROUTES = ['/motorista'];
const COMERCIAL_ROUTES = ['/comercial'];
const CHAO_TV_ROUTES = ['/tv'];

const ROLE_ROUTE_MAP: Record<Role, string[]> = {
  admin: ADMIN_ROUTES,
  lider: LIDER_ROUTES,
  logistica: LOGISTICA_ROUTES,
  motorista: MOTORISTA_ROUTES,
  comercial: COMERCIAL_ROUTES,
  chao_tv: CHAO_TV_ROUTES,
};

export function canAccessRoute(role: string | null, path: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase() as Role;
  const allowed = ROLE_ROUTE_MAP[r];
  if (!allowed) return false;
  const normalized = path === '' || path === '/' ? '/' : path.replace(/\/$/, '');
  return allowed.some((p) => p === '/' ? normalized === '/' : normalized.startsWith(p));
}

export function canAccessPath(role: string | null, path: string): boolean {
  return canAccessRoute(role, path);
}

export function getDefaultRouteForRole(role: string | null): string {
  if (!role) return '/';
  const r = role.toLowerCase() as Role;
  const allowed = ROLE_ROUTE_MAP[r];
  if (!allowed || allowed.length === 0) return '/';
  return allowed[0];
}
