import React, { createContext, useState, useEffect, useContext } from 'react';

// Définir la structure de notre utilisateur
interface User {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SCANNER' | 'MC';
  canEdit: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la session stockée au démarrage de l'application
  useEffect(() => {
    const storedToken = localStorage.getItem('wedding_guard_token');
    const storedUser = localStorage.getItem('wedding_guard_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Fonction pour se connecter
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('wedding_guard_token', newToken);
    localStorage.setItem('wedding_guard_user', JSON.stringify(newUser));
  };

  // Fonction pour se déconnecter
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wedding_guard_token');
    localStorage.removeItem('wedding_guard_user');
    window.location.href = '/login';
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser facilement l'auth dans nos composants
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};