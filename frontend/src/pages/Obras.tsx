import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit, HardHat } from 'lucide-react';

interface Obra {
  id: number; nombre: string; cliente: string; descripcion: string;
  fecha_inicio: string; fecha_fin_estimada: string; monto_contrato: number;
  moneda: string; tipo_cashflow: string; estado: string;
  total_ingresos: number; total_egresos: number;
}

const EMPTY = { nombre: '', cliente: '', descripcion: '', fecha_inicio: '', fecha_fin_estimada: '', monto_contrato: 0, moneda: 'ARS', tipo_cashflow: 'mensual', estado: 'activa' };

export default function Obras() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Obra | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });

  const load = () => api.getObras().then(setObras);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setModal(true); };
  const openEdit = (o: Obra) => { setEditing(o); setForm({ nombre: o.nombre, cliente: o.cliente, descripcion: o.descripcion || '', fecha_inicio: o.fecha_inicio || '', fecha_fin_estimada: o.fecha_fin_estimada || '', monto_contrato: o.monto_contrato, moneda: o.moneda, tipo_cashflow: o.tipo_cashflow, estado: o.estado }); setModal(true); };

  const save = async () => {
    if (editing) await api.updateObra(editing.id, form);
    else await api.createObra(form);
    setModal(false); load();
  };

  const del = async (id: number) => {
    if (!confirm('¿Eliminar esta obra? Se borrarán todos sus datos.')) return;
    await api.deleteObra(id); load();
  };

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Obras</h1>
          <p className="text-slate-500 text-sm mt-1">{obras.length} obra{obras.length !== 1 ? 's' : ''} registrada{obras.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva obra
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {obras.map(o => {
          const saldo = (o.total_ingresos || 0) - (o.total_egresos || 0);
          return (
            <div key={o.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <HardHat size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{o.nombre}</div>
                    <div className="text-sm text-slate-400">{o.cliente}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(o)} className="text-slate-400 hover:text-primary transition-colors"><Edit size={15} /></button>
                  <button onClick={() => del(o.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-slate-400 text-xs mb-0.5">Contrato</div>
                  <div className="font-bold">{fmt(o.monto_contrato, o.moneda)}</div>
                </div>
                <div className={`rounded-lg p-3 ${saldo >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <div className="text-slate-400 text-xs mb-0.5">Saldo caja</div>
                  <div className={`font-bold ${saldo >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(saldo, o.moneda)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={o.estado === 'activa' ? 'badge-success' : o.estado === 'finalizada' ? 'badge-warning' : 'badge-danger'}>{o.estado}</span>
                  <span className="text-xs text-slate-400">{o.tipo_cashflow}</span>
                </div>
                <Link to={`/obras/${o.id}`} className="btn-primary text-xs py-1.5 px-3">Ver detalle →</Link>
              </div>
            </div>
          );
        })}
      </div>

      {obras.length === 0 && (
        <div className="card text-center py-16 text-slate-400">
          <HardHat size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay obras registradas aún.</p>
          <button onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={15} /> Crear primera obra
          </button>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Editar obra' : 'Nueva obra'} onClose={() => setModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre de la obra *</label>
              <input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Edificio Libertador" />
            </div>
            <div className="col-span-2">
              <label className="label">Cliente *</label>
              <input className="input" value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="col-span-2">
              <label className="label">Descripción</label>
              <textarea className="input" rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha inicio</label>
              <input type="date" className="input" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha fin estimada</label>
              <input type="date" className="input" value={form.fecha_fin_estimada} onChange={e => set('fecha_fin_estimada', e.target.value)} />
            </div>
            <div>
              <label className="label">Monto del contrato</label>
              <input type="number" className="input" value={form.monto_contrato} onChange={e => set('monto_contrato', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label">Moneda</label>
              <select className="input" value={form.moneda} onChange={e => set('moneda', e.target.value)}>
                <option value="ARS">ARS (Peso argentino)</option>
                <option value="USD">USD (Dólar)</option>
                <option value="CLP">CLP (Peso chileno)</option>
                <option value="COP">COP (Peso colombiano)</option>
              </select>
            </div>
            <div>
              <label className="label">Tipo de cash flow</label>
              <select className="input" value={form.tipo_cashflow} onChange={e => set('tipo_cashflow', e.target.value)}>
                <option value="mensual">Mensual</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.estado} onChange={e => set('estado', e.target.value)}>
                <option value="activa">Activa</option>
                <option value="pausada">Pausada</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={save} className="btn-primary" disabled={!form.nombre || !form.cliente}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
