import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function Layout() {
  const [dark, setDark] = useDarkMode();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`min-h-screen ${dark ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 min-h-screen">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
          <Header
            dark={dark}
            onToggleDark={() => setDark(!dark)}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className="p-6 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
