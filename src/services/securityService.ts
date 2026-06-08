import { persianDate } from '../db/database';

type UserRole = 'admin' | 'accountant' | 'sales' | 'inventory';

interface AuthenticatedUser {
  username: string;
  name: string;
  role: UserRole;
  loginAt: string;
}

// ============================================
// 1. AUTHENTICATION & SECURITY
// ============================================
export const authService = {
  users: [
    { username: 'admin', password: '123456', name: 'مدیر سیستم', role: 'admin' as UserRole },
    { username: 'accountant', password: '123456', name: 'حسابدار', role: 'accountant' as UserRole },
    { username: 'sales', password: '123456', name: 'فروشنده', role: 'sales' as UserRole },
    { username: 'inventory', password: '123456', name: 'انباردار', role: 'inventory' as UserRole },
  ],

  login(username: string, password: string): AuthenticatedUser | null {
    const user = this.users.find((u) => u.username === username && u.password === password);
    if (!user) return null;

    const session: AuthenticatedUser = {
      username: user.username,
      name: user.name,
      role: user.role,
      loginAt: persianDate(),
    };

    localStorage.setItem('erp_auth_token', 'logged_in');
    localStorage.setItem('erp_user_role', user.role);
    localStorage.setItem('erp_user_name', user.name);

    // Audit log: login event
    this.audit('ورود به سیستم', `کاربر ${user.name} (${user.role}) وارد سیستم شد`, session);

    return session;
  },

  logout() {
    const name = localStorage.getItem('erp_user_name') || 'کاربر';
    this.audit('خروج از سیستم', `کاربر ${name} از سیستم خارج شد`, this.getSession());
    localStorage.removeItem('erp_auth_token');
    localStorage.removeItem('erp_user_role');
    localStorage.removeItem('erp_user_name');
    window.location.reload();
  },

  getSession(): AuthenticatedUser | null {
    const token = localStorage.getItem('erp_auth_token');
    if (token !== 'logged_in') return null;
    return {
      username: localStorage.getItem('erp_user_role') || 'admin',
      name: localStorage.getItem('erp_user_name') || 'مدیر',
      role: (localStorage.getItem('erp_user_role') as UserRole) || 'admin',
      loginAt: persianDate(),
    };
  },

  isAuthenticated(): boolean {
    return localStorage.getItem('erp_auth_token') === 'logged_in';
  },

  // ============================================
  // 2. AUDIT LOG (ISO 27001 / SOC 2)
  // ============================================
  audit(action: string, description: string, user: AuthenticatedUser | null = null) {
    const session = user || this.getSession();
    try {
      const auditKey = `erp_audit_${Date.now()}`;
      const record = {
        id: auditKey,
        timestamp: persianDate(),
        action,
        description,
        username: session?.username || 'unknown',
        userRole: session?.role || 'unknown',
        userName: session?.name || 'کاربر',
      };
      const logs = JSON.parse(localStorage.getItem('erp_audit_log') || '[]');
      logs.push(record);
      localStorage.setItem('erp_audit_log', JSON.stringify(logs));
    } catch {}
  },

  getAuditLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('erp_audit_log') || '[]').reverse();
    } catch { return []; }
  },

  clearAuditLogs() {
    localStorage.removeItem('erp_audit_log');
  },

  // ============================================
  // 3. ROLE-BASED ACCESS CONTROL (NIST RBAC)
  // ============================================
  roleAccess: {
    admin: ['dashboard', 'catalog', 'pos', 'sales', 'purchases', 'inventory', 'manufacturing',
            'accounting', 'banking', 'currencies', 'installments', 'tax', 'crm', 'payroll',
            'reports', 'notifications', 'access', 'settings', 'audit'],
    accountant: ['dashboard', 'accounting', 'banking', 'currencies', 'installments', 'tax',
                  'reports', 'notifications', 'settings', 'audit'],
    sales: ['dashboard', 'pos', 'sales', 'crm', 'installments', 'notifications'],
    inventory: ['dashboard', 'catalog', 'inventory', 'manufacturing', 'purchases', 'notifications'],
  } as Record<UserRole, string[]>,

  canAccess(role: UserRole, page: string): boolean {
    const allowed = this.roleAccess[role] || this.roleAccess.admin;
    return allowed.includes(page);
  },
};

// ============================================
// 4. SOFT DELETE (instead of permanent delete)
// ============================================
export const softDeleteService = {
  markDeleted(key: string, id: string | number) {
    const trashKey = `erp_trash_${key}`;
    try {
      const trash = JSON.parse(localStorage.getItem(trashKey) || '[]');
      trash.push({ id, deletedAt: persianDate(), deletedBy: localStorage.getItem('erp_user_name') || 'کاربر' });
      localStorage.setItem(trashKey, JSON.stringify(trash));
    } catch {}
  },

  getDeleted(key: string): any[] {
    try {
      return JSON.parse(localStorage.getItem(`erp_trash_${key}`) || '[]');
    } catch { return []; }
  },

  restore(key: string, id: string | number) {
    const trashKey = `erp_trash_${key}`;
    try {
      const trash = JSON.parse(localStorage.getItem(trashKey) || '[]');
      localStorage.setItem(trashKey, JSON.stringify(trash.filter((t: any) => t.id !== id)));
    } catch {}
  },

  purge(key: string) {
    localStorage.removeItem(`erp_trash_${key}`);
  },
};
