import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit, Users } from 'lucide-react';

interface Proveedor {
  id: number; nombre: string; rubro_especialidad: string;
  contacto: string; email: string; telefono: string; cuit: string;
}

const EMPTY = { nombre: '', rubro_especialidad: '', contacto: '', email: '', telefono: '', cuit: '' };

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [search, setSearch] = useState('');

  const load = () => api.getProveedores().then(setProveedores);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setModal(true); };
  const openEdit = (p: Proveedor) => { setEditing(p); setForm({ nombre: p.nombre, rubro_especialidad: p.rubro_especialidad || '', contacto: p.contacto || '', email: p.email || '', telefono: p.telefono || '', cuit: p.cuit || '' }); setModal(true); };

  const save = async () => {
    if (editing) await api.updateProveedor(editing.id, form);
    else await api.createProveedor(form);
    setModal(false); load();
  };

  const del = async (id: number) => {
    if (!confirm('¿Eliminar proveedor?')) return;
    await api.deleteProveedor(id); load();
  };

  const filtered = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.rubro_especialidad || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
          <p className="text-slate-500 text-sm mt-1">{proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''} registrado{proveedores.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Buscar por nombre o rubro..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {p.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{p.nombre}</div>
                  {p.rubro_especialidad && <div className="text-xs text-slate-400">{p.rubro_especialidad}</div>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="text-slate-300 hover:text-primary transition-colors"><Edit size={14} /></button>
                <button onClick={() => del(p.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="space-y-1 text-sm text-slate-500">
              {p.contacto && <div>👤 {p.contacto}</div>}
              {p.telefono && <div>📞 {p.telefono}</div>}
              {p.email && <div>✉️ {p.email}</div>}
              {p.cuit && <div className="text-xs text-slate-400">CUIT/RUT: {p.cuit}</div>}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-16 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? 'Sin resultados para la búsqueda' : 'No hay proveedores registrados'}</p>
          {!search && (
            <button onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={15} /> Agregar proveedor
            </button>
          )}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div><label className="label">Nombre *</label><input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre o razón social" /></div>
            <div><label className="label">Rubro / especialidad</label><input className="input" value={form.rubro_especialidad} onChange={e => setForm(f => ({ ...f, rubro_especialidad: e.target.value }))} placeholder="Ej: Electricidad, Hormigón..." /></div>
            <div><label className="label">Contacto</label><input className="input" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} placeholder="Nombre de contacto" /></div>
            <div><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+54 11..." /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label className="label">CUIT / RUT</label><input className="input" value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary" disabled={!form.nombre}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
