import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('saas_token'));
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(() => {
    const saved = localStorage.getItem('saas_current_org');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication on load
  const loadUser = async () => {
    const storedToken = localStorage.getItem('saas_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
        const orgs = res.data.data.organizations || [];
        setOrganizations(orgs);

        // Match currentOrg or default to first organization
        const savedOrg = localStorage.getItem('saas_current_org');
        let selected = null;
        if (savedOrg) {
          const parsed = JSON.parse(savedOrg);
          selected = orgs.find(o => o.id === parsed.id);
        }

        if (!selected && orgs.length > 0) {
          selected = orgs[0];
        }

        if (selected) {
          setCurrentOrg(selected);
          localStorage.setItem('saas_current_org', JSON.stringify(selected));
        }
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: userData, token: jwtToken, organizations: orgs } = res.data.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('saas_token', jwtToken);

      setOrganizations(orgs);
      if (orgs.length > 0) {
        setCurrentOrg(orgs[0]);
        localStorage.setItem('saas_current_org', JSON.stringify(orgs[0]));
      }
      return res.data;
    }
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    if (res.data.success) {
      const { user: userData, token: jwtToken, organization: orgData } = res.data.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('saas_token', jwtToken);

      const initialOrg = {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug,
        role_name: 'Admin',
        membership_status: 'active'
      };

      setOrganizations([initialOrg]);
      setCurrentOrg(initialOrg);
      localStorage.setItem('saas_current_org', JSON.stringify(initialOrg));
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      setOrganizations([]);
      setCurrentOrg(null);
      localStorage.removeItem('saas_token');
      localStorage.removeItem('saas_current_org');
    }
  };

  const switchOrganization = (org) => {
    setCurrentOrg(org);
    localStorage.setItem('saas_current_org', JSON.stringify(org));
    // Trigger window location reload or clean data refresh
    window.location.reload();
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const hasPermission = (permissionKey) => {
    if (!currentOrg) return false;
    if (currentOrg.role_name === 'Admin') return true;
    // For manager/member, can check against role defaults
    if (currentOrg.role_name === 'Manager') {
      const forbidden = ['role:manage', 'project:delete', 'organization:update'];
      return !forbidden.includes(permissionKey);
    }
    if (currentOrg.role_name === 'Member') {
      const allowed = ['organization:read', 'user:read', 'project:read', 'task:read', 'task:update', 'dashboard:read'];
      return allowed.includes(permissionKey);
    }
    return false;
  };

  const isAdmin = currentOrg?.role_name === 'Admin';
  const isManager = currentOrg?.role_name === 'Manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        organizations,
        currentOrg,
        loading,
        login,
        register,
        logout,
        switchOrganization,
        refreshUser,
        hasPermission,
        isAdmin,
        isManager
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
