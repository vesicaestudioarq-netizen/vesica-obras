import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { HardHat, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.setupNeeded().then(({ needed }) => {
      if (needed) setMode('setup');
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'setup') {
        await api.register({ nombre, email, password, rol: 'admin' });
        setMode('login');
      } else {
        const { token, user } = await api.login(email, password);
        login(token, user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <HardHat size={22} className="text-primary" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-lg leading-tight">Vesica Obras</div>
            <div className="text-xs text-slate-400">Gestión financiera de obra</div>
          </div>
        </div>

        {mode === 'setup' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
            <strong>Primera configuración</strong><br />
            Creá tu cuenta de administrador para comenzar.
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'setup' && (
            <div>
              <label className="label">Nombre completo</label>
              <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input pr-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</div>}

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-2.5 text-center disabled:opacity-50">
            {loading ? 'Cargando...' : mode === 'setup' ? 'Crear cuenta admin' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
