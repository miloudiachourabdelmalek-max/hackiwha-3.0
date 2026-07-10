import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuth } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true); // stub for session restore — tokens kept in memory only, no localStorage
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setAuth({ token: data.data.accessToken });
    setUser(data.data.user);
    const { data: orgs } = await api.get('/organizations');
    const org = orgs.data[0];
    setOrganization(org);
    setAuth({ organizationId: org?.id });
    return org;
  }

  function logout() {
    setAuth({ token: null, organizationId: null });
    setUser(null);
    setOrganization(null);
  }

  return (
    <AuthContext.Provider value={{ user, organization, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
