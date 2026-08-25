import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Obras from './pages/Obras';
import ObraDetalle from './pages/ObraDetalle';
import Proveedores from './pages/Proveedores';
import Usuarios from './pages/Usuarios';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';

function PrivateLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/obras/:id" element={<ObraDetalle />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<PrivateLayout />} />
      </Routes>
    </AuthProvider>
  );
}
