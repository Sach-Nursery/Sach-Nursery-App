import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { DatabaseService } from '../db/database.js';
import {
  DEFAULT_USERS,
  authenticateUser,
  canAccessPage,
  canEditSaleRecord,
  canUserExport
} from '../logic/erpLogic.js';

const AuthContext = createContext(null);
const db = new DatabaseService();

export function AuthProvider({ children, editWindowCfg = { value: 30, unit: 'minutes' } }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedUsers = (await db.get('users')) || DEFAULT_USERS;
      const savedSession = await db.get('activeSessionUser');
      setUsers(storedUsers);
      if (savedSession && storedUsers.some((u) => u.active && u.username === savedSession.username)) {
        setUser(savedSession);
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (username, password) => {
    const matched = authenticateUser(users, username, password);
    if (!matched) return { ok: false, error: 'Invalid username or password.' };
    setUser(matched);
    await db.set('activeSessionUser', matched);
    return { ok: true, user: matched };
  }, [users]);

  const logout = useCallback(async () => {
    setUser(null);
    await db.set('activeSessionUser', null);
  }, []);

  const updateUsersList = useCallback(async (nextUsers) => {
    setUsers(nextUsers);
    await db.set('users', nextUsers);
  }, []);

  const permissions = useMemo(() => {
    const role = user?.role || null;
    const isAdmin = role === 'Administrator';
    const isStaff = role === 'Staff';
    return {
      isAdmin,
      isStaff,
      canExecuteSales: isAdmin || isStaff,
      canViewSummaries: isAdmin || isStaff,
      canManageInventory: isAdmin,
      canManagePurchases: isAdmin,
      canManageWorkers: isAdmin,
      canManageSettings: isAdmin,
      canExport: canUserExport(role),
      canDelete: isAdmin,
      canAccess: (pageId) => canAccessPage(role, pageId),
      canEditSale: (record, nowMs = Date.now()) => canEditSaleRecord(user, record, editWindowCfg, nowMs)
    };
  }, [user, editWindowCfg]);

  return (
    <AuthContext.Provider value={{ user, users, loading, login, logout, updateUsersList, permissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
