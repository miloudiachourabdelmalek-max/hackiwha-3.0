import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Memory from './pages/Memory';
import MemoryDetail from './pages/MemoryDetail';
import MemoryNew from './pages/MemoryNew';

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="memory" element={<Memory />} />
        <Route path="memory/new" element={<MemoryNew />} />
        <Route path="memory/:id" element={<MemoryDetail />} />
      </Route>
    </Routes>
  );
}
