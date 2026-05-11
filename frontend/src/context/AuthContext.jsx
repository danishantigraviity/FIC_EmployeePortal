import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
    } catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path));
    
    if (!isPublicPath) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    setUser(null);
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
