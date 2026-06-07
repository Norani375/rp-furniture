/**
 * API Client — صحبت با Backend Server
 * --------------------------------------
 * اگر سرور backend در دسترس باشد، داده‌ها از Neon بارگذاری می‌شوند.
 * در غیر این صورت، به localStorage برمی‌گردد.
 */

const API_BASE = 'http://localhost:3001/api';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async post<T>(endpoint: string, data: any): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async put<T>(endpoint: string, data: any): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async del<T>(endpoint: string): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async isOnline(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },
};
