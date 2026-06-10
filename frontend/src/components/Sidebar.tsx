import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      name: 'Tableau de bord',
      path: '/dashboard',
      roles: ['SUPER_ADMIN', 'ADMIN'],
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
      {
      name: "Journal d'Audit",
      path: '/audit-logs',
      roles: ['SUPER_ADMIN', 'ADMIN'], // Accessible pour l'admin et le super_admin
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
      {
      name: 'Gestion des Invités',
      path: '/guests-admin', 
      roles: ['SUPER_ADMIN', 'ADMIN'],
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: "Gestion des utilisateurs",
      path: '/users-admin',
      roles: ['SUPER_ADMIN', 'ADMIN'],
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'MC (Annonces)',
      path: '/mc',
      roles: ['SUPER_ADMIN','MC','ADMIN'], // Le Super Admin (vous) et le MC y ont accès
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 text-white flex flex-col min-h-screen">
      {/* En-tête de la Sidebar */}
      <div className="p-6 border-b border-neutral-800 text-center">
        <h2 className="text-xl font-serif text-amber-400 tracking-wider">Wedding Guard</h2>
        <p className="text-neutral-500 text-[10px] uppercase tracking-widest mt-1">SaaS Control Panel</p>
      </div>

      {/* Profil de l'utilisateur connecté */}
      <div className="p-6 border-b border-neutral-800 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-serif text-amber-400 font-bold">
          {user?.username?.[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-200">{user?.username?.toUpperCase()}</p>
          <p className="text-xs text-amber-500 uppercase tracking-wider font-bold">{user?.role}</p>
        </div>
      </div>

      {/* Menu de Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems
          .filter((item) => user && item.roles.includes(user.role))
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 border ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                    : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                }`}
              >
                <span className={isActive ? 'text-amber-500' : 'text-neutral-500'}>
                  {item.icon}
                </span>
                {item.name}
              </button>
            );
          })}
      </nav>

      {/* Bouton de Déconnexion */}
      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-neutral-950/50 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/20 text-neutral-500 hover:text-red-500 py-3 rounded-lg text-sm font-bold transition-all duration-300 uppercase tracking-wider"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;