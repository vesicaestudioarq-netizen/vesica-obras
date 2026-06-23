import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import Modal from '../components/Modal';
import { Plus, Trash2, Shield, User } from 'lucide-react';

interface Usuario { id: number; nombre: string; email: string; rol: string; created_at: string; }

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'editor' });
  const [error, setError] = useState('');

  const load = () => api.getUsuarios().then(setUsuarios).catch(() => {});
  useEffect(() => { load(); }, []);

  if (user?.rol !== 'admin') {
    return (
      <div className="p-6">
        <div className="card text-center py-16 text-slate-400">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p>Solo los administradores pueden gestionar usuarios.</p>
        </div>
      </div>
    );
  }

  const save = async () => {
    setError('');
    try {
      await api.register(form);
      setModal(false);
      setForm({ nombre: '', email: '', password: '', rol: 'editor' });
      load();
    } catch (e: any) {
      setError(e.message || 'Error al crear usuario');
    }
  };

  const del = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await api.deleteUsuario(id);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-1">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-3">Usuario</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Rol</th>
              <th className="pb-3">Alta</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  {u.nombre}
                  {u.id === user?.id && <span className="text-xs text-slate-400">(vos)</span>}
                </td>
                <td className="py-3 text-slate-500">{u.email}</td>
                <td className="py-3">
                  <span className={u.rol === 'admin' ? 'badge-success' : 'badge-warning'}>{u.rol}</span>
                </td>
                <td className="py-3 text-slate-400">{u.created_at?.slice(0, 10)}</td>
                <td className="py-3 text-right">
                  {u.id !== user?.id && (
                    <button onClick={() => del(u.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Nuevo usuario" onClose={() => { setModal(false); setError(''); }}>
          <div className="space-y-4">
            <div><label className="label">Nombre completo *</label><input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
            <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label className="label">Contraseña *</label><input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" /></div>
            <div>
              <label className="label">Rol</label>
              <select className="input" value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                <option value="editor">Editor — puede cargar y editar datos</option>
                <option value="admin">Admin — puede también gestionar usuarios</option>
              </select>
            </div>
            {error && <div className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => { setModal(false); setError(''); }} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary" disabled={!form.nombre || !form.email || !form.password}>Crear usuario</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
