import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/memory', label: 'Memory' },
];

export function AppShell() {
  const { user, organization, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-line flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-line">
          <div className="font-semibold text-sm">{organization?.name || 'Marketing Intel'}</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm ${isActive ? 'bg-accent/10 text-accent font-medium' : 'text-ink/70 hover:bg-ink/5'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-line text-sm text-ink/60 flex items-center justify-between">
          <span>{user?.name}</span>
          <button onClick={logout} className="text-xs underline">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
