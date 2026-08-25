import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, HardHat, Users, LogOut, UserCog, Settings } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/obras', icon: HardHat, label: 'Obras' },
  { to: '/proveedores', icon: Users, label: 'Proveedores' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 bg-primary min-h-screen flex flex-col shrink-0">
      <div className="px-6 py-6 border-b border-beige/10">
        <div className="flex items-center gap-2">
          <HardHat size={24} className="text-accent-light" />
          <div>
            <div className="font-bold text-lg leading-tight text-beige">Vesica Obras</div>
            <div className="text-xs text-beige/50">Gestión financiera de obra</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-beige/15 text-beige'
                  : 'text-beige/60 hover:bg-beige/10 hover:text-beige'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive ? 'bg-beige/15 text-beige' : 'text-beige/60 hover:bg-beige/10 hover:text-beige'
            }`
          }
        >
          <Settings size={18} />
          Configuración
        </NavLink>
        {user?.rol === 'admin' && (
          <NavLink
            to="/usuarios"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-beige/15 text-beige'
                  : 'text-beige/60 hover:bg-beige/10 hover:text-beige'
              }`
            }
          >
            <UserCog size={18} />
            Usuarios
          </NavLink>
        )}
      </nav>

      {user && (
        <div className="px-4 py-4 border-t border-beige/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-beige">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-beige truncate">{user.nombre}</div>
              <div className="text-xs text-beige/40">{user.rol}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-beige/60 hover:bg-beige/10 hover:text-beige transition-all text-sm"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      )}

      <div className="px-6 py-3 text-xs text-beige/20">
        v1.0 · {new Date().getFullYear()}
      </div>
    </aside>
  );
}
