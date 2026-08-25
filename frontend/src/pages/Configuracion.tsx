import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';

export default function Configuracion() {
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', color: '#6366f1', descripcion: '' });

  const load = async () => setCatalogo(await api.getCatalogo());
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ nombre: '', color: '#6366f1', descripcion: '' }); setModal(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ nombre: r.nombre, color: r.color, descripcion: r.descripcion || '' }); setModal(true); };

  const save = async () => {
    if (editing) await api.updateCatalogo(editing.id, form);
    else await api.createCatalogo(form);
    setModal(false); load();
  };

  const del = async (id: number) => {
    if (!confirm('¿Eliminar este rubro del catálogo? No afecta los rubros ya asignados a obras.')) return;
    await api.deleteCatalogo(id); load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={22} className="text-primary" />
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
      </div>

      <div className="card max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-800">Catálogo de rubros</h2>
            <p className="text-sm text-slate-400 mt-0.5">Rubros predeterminados para asignar a cada obra</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Nuevo rubro
          </button>
        </div>

        {catalogo.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Settings size={32} className="mx-auto mb-2 opacity-30" />
            <p>No hay rubros en el catálogo</p>
            <button onClick={openCreate} className="btn-primary mt-3 inline-flex items-center gap-2">
              <Plus size={14} /> Crear primer rubro
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {catalogo.map(r => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: r.color }} />
                  <div>
                    <div className="font-medium text-slate-800">{r.nombre}</div>
                    {r.descripcion && <div className="text-xs text-slate-400">{r.descripcion}</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(r)} className="text-slate-300 hover:text-primary"><Edit size={15} /></button>
                  <button onClick={() => del(r.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={editing ? 'Editar rubro' : 'Nuevo rubro del catálogo'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Estructura, Mampostería, Instalaciones..." />
            </div>
            <div>
              <label className="label">Color</label>
              <input type="color" className="input h-10" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
            <div>
              <label className="label">Descripción</label>
              <input className="input" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Opcional" />
            </div>
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
