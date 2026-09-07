import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, fmt } from '../lib/api';
import Modal from '../components/Modal';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ArrowLeft, Plus, Trash2, Edit, Download, TrendingUp, TrendingDown,
  Wallet, AlertCircle, Tag, Users, BarChart3, FileText, BookOpen
} from 'lucide-react';

const TABS = ['Resumen', 'Cash Flow', 'Ingresos', 'Egresos', 'Rubros', 'Proveedores', 'Adicionales'];
const ESTADOS_ADICIONAL = ['pendiente', 'aprobado', 'rechazado'];
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

const TIPOS_INGRESO = ['cuota', 'anticipo', 'certificado', 'adicional', 'otro'];
const ESTADOS_EGRESO = ['pagado', 'pendiente'];

export default function ObraDetalle() {
  const { id } = useParams<{ id: string }>();
  const obraId = Number(id);

  const [tab, setTab] = useState('Resumen');
  const [resumen, setResumen] = useState<any>(null);
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [egresos, setEgresos] = useState<any[]>([]);
  const [rubros, setRubros] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [adicionales, setAdicionales] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [modalCatalogo, setModalCatalogo] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Record<number, { checked: boolean; presupuesto: string }>>({});

  // Modals
  const [modalIngreso, setModalIngreso] = useState(false);
  const [modalEgreso, setModalEgreso] = useState(false);
  const [modalRubro, setModalRubro] = useState(false);
  const [editingIngreso, setEditingIngreso] = useState<any>(null);
  const [editingEgreso, setEditingEgreso] = useState<any>(null);
  const [editingRubro, setEditingRubro] = useState<any>(null);
  const [modalAdicional, setModalAdicional] = useState(false);
  const [editingAdicional, setEditingAdicional] = useState<any>(null);

  const emptyIngreso = { fecha: new Date().toISOString().slice(0,10), monto: '', descripcion: '', tipo: 'cuota', numero_cuota: '' };
  const emptyEgreso = { fecha: new Date().toISOString().slice(0,10), monto: '', descripcion: '', rubro_id: '', proveedor_id: '', numero_factura: '', estado: 'pagado' };
  const emptyRubro = { nombre: '', presupuesto: '', descripcion: '', color: '#6366f1' };
  const emptyAdicional = { fecha: new Date().toISOString().slice(0,10), monto: '', descripcion: '', estado: 'pendiente', cobrado: false, numero_factura: '' };

  const [formIngreso, setFormIngreso] = useState({ ...emptyIngreso });
  const [formEgreso, setFormEgreso] = useState({ ...emptyEgreso });
  const [formRubro, setFormRubro] = useState({ ...emptyRubro });
  const [formAdicional, setFormAdicional] = useState<any>({ ...emptyAdicional });

  const loadAll = useCallback(async () => {
    const [res, cf, ing, egr, rub, prov, adic, cat] = await Promise.all([
      api.getResumen(obraId),
      api.getCashflow(obraId),
      api.getIngresos(obraId),
      api.getEgresos(obraId),
      api.getRubros(obraId),
      api.getProveedores(),
      api.getAdicionales(obraId),
      api.getCatalogo(),
    ]);
    setResumen(res);
    setCashflow(cf);
    setIngresos(ing);
    setEgresos(egr);
    setRubros(rub);
    setProveedores(prov);
    setAdicionales(adic);
    setCatalogo(cat);
  }, [obraId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // --- INGRESOS ---
  const openCreateIngreso = () => { setEditingIngreso(null); setFormIngreso({ ...emptyIngreso }); setModalIngreso(true); };
  const openEditIngreso = (i: any) => {
    setEditingIngreso(i);
    setFormIngreso({ fecha: i.fecha, monto: i.monto, descripcion: i.descripcion || '', tipo: i.tipo, numero_cuota: i.numero_cuota || '' });
    setModalIngreso(true);
  };
  const saveIngreso = async () => {
    const data = { ...formIngreso, obra_id: obraId, monto: parseFloat(String(formIngreso.monto)), numero_cuota: formIngreso.numero_cuota || null };
    if (editingIngreso) await api.updateIngreso(editingIngreso.id, data);
    else await api.createIngreso(data);
    setModalIngreso(false); loadAll();
  };
  const delIngreso = async (id: number) => { if (!confirm('¿Eliminar ingreso?')) return; await api.deleteIngreso(id); loadAll(); };

  // --- EGRESOS ---
  const openCreateEgreso = () => { setEditingEgreso(null); setFormEgreso({ ...emptyEgreso }); setModalEgreso(true); };
  const openEditEgreso = (e: any) => {
    setEditingEgreso(e);
    setFormEgreso({ fecha: e.fecha, monto: e.monto, descripcion: e.descripcion, rubro_id: e.rubro_id || '', proveedor_id: e.proveedor_id || '', numero_factura: e.numero_factura || '', estado: e.estado });
    setModalEgreso(true);
  };
  const saveEgreso = async () => {
    const data = { ...formEgreso, obra_id: obraId, monto: parseFloat(String(formEgreso.monto)), rubro_id: formEgreso.rubro_id || null, proveedor_id: formEgreso.proveedor_id || null };
    if (editingEgreso) await api.updateEgreso(editingEgreso.id, data);
    else await api.createEgreso(data);
    setModalEgreso(false); loadAll();
  };
  const delEgreso = async (id: number) => { if (!confirm('¿Eliminar egreso?')) return; await api.deleteEgreso(id); loadAll(); };

  // --- RUBROS ---
  const openCreateRubro = () => { setEditingRubro(null); setFormRubro({ ...emptyRubro }); setModalRubro(true); };
  const openEditRubro = (r: any) => {
    setEditingRubro(r);
    setFormRubro({ nombre: r.nombre, presupuesto: r.presupuesto, descripcion: r.descripcion || '', color: r.color });
    setModalRubro(true);
  };
  const saveRubro = async () => {
    const data = { ...formRubro, obra_id: obraId, presupuesto: parseFloat(String(formRubro.presupuesto)) || 0 };
    if (editingRubro) await api.updateRubro(editingRubro.id, data);
    else await api.createRubro(data);
    setModalRubro(false); loadAll();
  };
  const delRubro = async (id: number) => { if (!confirm('¿Eliminar rubro?')) return; await api.deleteRubro(id); loadAll(); };

  const openCatalogo = () => {
    const rubroNombresExistentes = rubros.map((r: any) => r.nombre.toLowerCase());
    const init: Record<number, { checked: boolean; presupuesto: string }> = {};
    catalogo.forEach(c => {
      init[c.id] = { checked: false, presupuesto: '' };
    });
    setSeleccionados(init);
    setModalCatalogo(true);
  };
  const agregarDesdeCatalogo = async () => {
    const elegidos = catalogo.filter(c => seleccionados[c.id]?.checked);
    await Promise.all(elegidos.map(c =>
      api.createRubro({ obra_id: obraId, nombre: c.nombre, color: c.color, descripcion: c.descripcion, presupuesto: parseFloat(seleccionados[c.id].presupuesto) || 0 })
    ));
    setModalCatalogo(false);
    loadAll();
  };

  // --- ADICIONALES ---
  const openCreateAdicional = () => { setEditingAdicional(null); setFormAdicional({ ...emptyAdicional }); setModalAdicional(true); };
  const openEditAdicional = (a: any) => {
    setEditingAdicional(a);
    setFormAdicional({ fecha: a.fecha, monto: a.monto, descripcion: a.descripcion, estado: a.estado, cobrado: !!a.cobrado, numero_factura: a.numero_factura || '' });
    setModalAdicional(true);
  };
  const saveAdicional = async () => {
    const data = { ...formAdicional, obra_id: obraId, monto: parseFloat(String(formAdicional.monto)) };
    if (editingAdicional) await api.updateAdicional(editingAdicional.id, data);
    else await api.createAdicional(data);
    setModalAdicional(false); loadAll();
  };
  const delAdicional = async (id: number) => { if (!confirm('¿Eliminar adicional?')) return; await api.deleteAdicional(id); loadAll(); };

  if (!resumen) return <div className="p-8 text-slate-400">Cargando...</div>;

  const { obra, totalIngresos, totalEgresos, egresosPendientes, saldoCaja, porCobrar } = resumen;
  const moneda = obra.moneda;

  const pieData = rubros.filter(r => r.gastado > 0).map((r, i) => ({ name: r.nombre, value: r.gastado, color: r.color || COLORS[i % COLORS.length] }));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to="/obras" className="text-slate-400 hover:text-primary transition-colors"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{obra.nombre}</h1>
            <p className="text-slate-400 text-sm">{obra.cliente} · <span className={obra.estado === 'activa' ? 'text-emerald-500' : 'text-amber-500'}>{obra.estado}</span> · cash flow {obra.tipo_cashflow}</p>
          </div>
        </div>
        <button onClick={() => api.exportarExcel(obraId)} className="btn-secondary flex items-center gap-2">
          <Download size={15} /> Exportar Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Contrato total', value: fmt(obra.monto_contrato, moneda), icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Cobrado', value: fmt(totalIngresos, moneda), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Por cobrar', value: fmt(porCobrar, moneda), icon: AlertCircle, color: porCobrar > 0 ? 'text-amber-600' : 'text-slate-400', bg: 'bg-amber-50' },
          { label: 'Pagado', value: fmt(totalEgresos, moneda), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Saldo en caja', value: fmt(saldoCaja, moneda), icon: Wallet, color: saldoCaja >= 0 ? 'text-emerald-600' : 'text-red-600', bg: saldoCaja >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
          { label: 'Falta pagar rubros', value: fmt(rubros.reduce((s, r) => s + Math.max(0, r.presupuesto - r.gastado), 0), moneda), icon: AlertCircle, color: rubros.reduce((s, r) => s + Math.max(0, r.presupuesto - r.gastado), 0) > 0 ? 'text-amber-600' : 'text-slate-400', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={`card flex flex-col gap-2 ${s.bg} border-0`}>
            <s.icon size={16} className={s.color} />
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`font-bold text-base ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: RESUMEN */}
      {tab === 'Resumen' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Distribución por rubros */}
          <div className="card">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Tag size={16} /> Gasto por rubro</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v, moneda)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-sm text-center py-10">Sin egresos registrados por rubro</p>}
          </div>

          {/* Tabla rubros resumen */}
          <div className="card">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><BarChart3 size={16} /> Rubros presupuestados</h3>
            <div className="space-y-3">
              {rubros.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No hay rubros definidos</p>}
              {rubros.map((r, i) => {
                const pct = r.presupuesto > 0 ? Math.min((r.gastado / r.presupuesto) * 100, 100) : 0;
                return (
                  <div key={r.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{r.nombre}</span>
                      <span className="text-slate-400">{fmt(r.gastado, moneda)} / {fmt(r.presupuesto, moneda)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: r.color || COLORS[i % COLORS.length] }} />
                    </div>
                    {r.pendiente > 0 && <div className="text-xs text-amber-500 mt-0.5">+ {fmt(r.pendiente, moneda)} pendiente</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Últimos movimientos */}
          <div className="card md:col-span-2">
            <h3 className="font-bold text-slate-700 mb-4">Últimos movimientos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2">Fecha</th><th className="pb-2">Tipo</th><th className="pb-2">Descripción</th><th className="pb-2 text-right">Monto</th>
                </tr></thead>
                <tbody>
                  {[
                    ...ingresos.slice(0, 5).map(i => ({ ...i, _tipo: 'ingreso' })),
                    ...egresos.slice(0, 5).map(e => ({ ...e, _tipo: 'egreso' }))
                  ].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8).map((m, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 text-slate-400">{m.fecha}</td>
                      <td className="py-2"><span className={m._tipo === 'ingreso' ? 'badge-success' : 'badge-danger'}>{m._tipo}</span></td>
                      <td className="py-2 text-slate-600">{m.descripcion}</td>
                      <td className={`py-2 text-right font-semibold ${m._tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m._tipo === 'ingreso' ? '+' : '-'}{fmt(m.monto, moneda)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CASH FLOW */}
      {tab === 'Cash Flow' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-slate-700 mb-4">Ingresos vs Egresos ({obra.tipo_cashflow})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashflow} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v, moneda)} width={90} />
                <Tooltip formatter={(v: any) => fmt(v, moneda)} />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-bold text-slate-700 mb-4">Saldo acumulado en caja</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v, moneda)} width={90} />
                <Tooltip formatter={(v: any) => fmt(v, moneda)} />
                <Line type="monotone" dataKey="acumulado" name="Saldo acumulado" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-2">Período</th>
                <th className="pb-2 text-right">Ingresos</th>
                <th className="pb-2 text-right">Egresos</th>
                <th className="pb-2 text-right">Neto</th>
                <th className="pb-2 text-right">Acumulado</th>
              </tr></thead>
              <tbody>
                {cashflow.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 font-medium">{row.periodo}</td>
                    <td className="py-2 text-right text-emerald-600">{fmt(row.ingresos, moneda)}</td>
                    <td className="py-2 text-right text-red-500">{fmt(row.egresos, moneda)}</td>
                    <td className={`py-2 text-right font-semibold ${row.neto >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(row.neto, moneda)}</td>
                    <td className={`py-2 text-right font-bold ${row.acumulado >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(row.acumulado, moneda)}</td>
                  </tr>
                ))}
                {cashflow.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">Sin datos de cash flow</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: INGRESOS */}
      {tab === 'Ingresos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">{ingresos.length} ingreso{ingresos.length !== 1 ? 's' : ''} · Total: <span className="font-bold text-emerald-600">{fmt(totalIngresos, moneda)}</span></div>
            <button onClick={openCreateIngreso} className="btn-primary flex items-center gap-2"><Plus size={15} /> Registrar ingreso</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-2">Fecha</th><th className="pb-2">Tipo</th><th className="pb-2">N° Cuota</th><th className="pb-2">Descripción</th><th className="pb-2 text-right">Monto</th><th className="pb-2"></th>
              </tr></thead>
              <tbody>
                {ingresos.map(i => (
                  <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 text-slate-400">{i.fecha}</td>
                    <td className="py-2"><span className="badge-success">{i.tipo}</span></td>
                    <td className="py-2 text-slate-400">{i.numero_cuota || '-'}</td>
                    <td className="py-2">{i.descripcion}</td>
                    <td className="py-2 text-right font-bold text-emerald-600">+{fmt(i.monto, moneda)}</td>
                    <td className="py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEditIngreso(i)} className="text-slate-300 hover:text-primary"><Edit size={14} /></button>
                        <button onClick={() => delIngreso(i.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ingresos.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Sin ingresos registrados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: EGRESOS */}
      {tab === 'Egresos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">
              {egresos.length} egreso{egresos.length !== 1 ? 's' : ''} · Pagado: <span className="font-bold text-red-500">{fmt(totalEgresos, moneda)}</span>
              {egresosPendientes > 0 && <> · Pendiente: <span className="font-bold text-amber-500">{fmt(egresosPendientes, moneda)}</span></>}
            </div>
            <button onClick={openCreateEgreso} className="btn-primary flex items-center gap-2"><Plus size={15} /> Registrar egreso</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-2">Fecha</th><th className="pb-2">Descripción</th><th className="pb-2">Rubro</th><th className="pb-2">Proveedor</th><th className="pb-2">Factura</th><th className="pb-2">Estado</th><th className="pb-2 text-right">Monto</th><th className="pb-2"></th>
              </tr></thead>
              <tbody>
                {egresos.map(e => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 text-slate-400 whitespace-nowrap">{e.fecha}</td>
                    <td className="py-2 max-w-[200px] truncate">{e.descripcion}</td>
                    <td className="py-2 text-slate-400">{e.rubro_nombre || '-'}</td>
                    <td className="py-2 text-slate-400">{e.proveedor_nombre || '-'}</td>
                    <td className="py-2 text-slate-400">{e.numero_factura || '-'}</td>
                    <td className="py-2"><span className={e.estado === 'pagado' ? 'badge-success' : 'badge-warning'}>{e.estado}</span></td>
                    <td className="py-2 text-right font-bold text-red-500">-{fmt(e.monto, moneda)}</td>
                    <td className="py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEditEgreso(e)} className="text-slate-300 hover:text-primary"><Edit size={14} /></button>
                        <button onClick={() => delEgreso(e.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {egresos.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-slate-400">Sin egresos registrados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: RUBROS */}
      {tab === 'Rubros' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{rubros.length} rubro{rubros.length !== 1 ? 's' : ''} definido{rubros.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              {catalogo.length > 0 && (
                <button onClick={openCatalogo} className="btn-secondary flex items-center gap-2"><BookOpen size={15} /> Desde catálogo</button>
              )}
              <button onClick={openCreateRubro} className="btn-primary flex items-center gap-2"><Plus size={15} /> Nuevo rubro</button>
            </div>
          </div>

          {/* Resumen total de deudas */}
          {rubros.length > 0 && (() => {
            const totalPresup = rubros.reduce((s, r) => s + r.presupuesto, 0);
            const totalPagado = rubros.reduce((s, r) => s + r.gastado, 0);
            const totalDeuda  = rubros.reduce((s, r) => s + Math.max(0, r.presupuesto - r.gastado), 0);
            const totalDisp   = totalPresup - totalPagado;
            return (
              <div className="card bg-amber-50 border border-amber-100">
                <h4 className="text-sm font-bold text-amber-800 mb-3">Resumen de deudas por rubro</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Presupuesto total</div>
                    <div className="font-bold text-slate-700">{fmt(totalPresup, moneda)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Ya pagado</div>
                    <div className="font-bold text-emerald-600">{fmt(totalPagado, moneda)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Falta pagar (total)</div>
                    <div className={`font-bold text-lg ${totalDeuda > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmt(totalDeuda, moneda)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Ya pagado</div>
                    <div className={`font-bold ${totalDisp >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(totalDisp, moneda)}</div>
                  </div>
                </div>
                {totalDeuda > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200 space-y-1">
                    {rubros.filter(r => r.presupuesto - r.gastado > 0).map(r => (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                          <span className="text-slate-700">{r.nombre}</span>
                        </div>
                        <span className="font-semibold text-amber-700">{fmt(r.presupuesto - r.gastado, moneda)} falta pagar</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid md:grid-cols-2 gap-4">
            {rubros.map((r, i) => {
              const pct = r.presupuesto > 0 ? (r.gastado / r.presupuesto) * 100 : 0;
              const disponible = r.presupuesto - r.gastado - r.pendiente;
              return (
                <div key={r.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="font-bold text-slate-800">{r.nombre}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditRubro(r)} className="text-slate-300 hover:text-primary"><Edit size={14} /></button>
                      <button onClick={() => delRubro(r.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Presupuesto</div>
                      <div className="font-semibold text-slate-700">{fmt(r.presupuesto, moneda)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Pagado</div>
                      <div className="font-semibold text-emerald-600">{fmt(r.gastado, moneda)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Falta pagar</div>
                      <div className={`font-semibold ${(r.presupuesto - r.gastado) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{fmt(Math.max(0, r.presupuesto - r.gastado), moneda)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">Disponible</div>
                      <div className={`font-semibold ${disponible >= 0 ? 'text-primary' : 'text-red-600'}`}>{fmt(disponible, moneda)}</div>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: r.color || COLORS[i % COLORS.length] }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{pct.toFixed(0)}% ejecutado</span>
                    {r.pendiente > 0 && <span className="text-amber-500">{fmt(r.pendiente, moneda)} pendiente</span>}
                  </div>
                  {r.descripcion && <p className="text-xs text-slate-400 mt-2">{r.descripcion}</p>}
                </div>
              );
            })}
            {rubros.length === 0 && (
              <div className="col-span-2 card text-center py-12 text-slate-400">
                <Tag size={32} className="mx-auto mb-2 opacity-30" />
                <p>No hay rubros definidos</p>
                <button onClick={openCreateRubro} className="btn-primary mt-3 inline-flex items-center gap-2"><Plus size={14} /> Crear rubro</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PROVEEDORES */}
      {tab === 'Proveedores' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Proveedores que participaron en esta obra</p>
          <div className="grid md:grid-cols-2 gap-4">
            {[...new Set(egresos.filter(e => e.proveedor_id).map(e => e.proveedor_id))].map(provId => {
              const prov = proveedores.find(p => p.id === provId);
              if (!prov) return null;
              const pagos = egresos.filter(e => e.proveedor_id === provId);
              const total = pagos.reduce((s, p) => s + p.monto, 0);
              const pendiente = pagos.filter(p => p.estado === 'pendiente').reduce((s, p) => s + p.monto, 0);
              return (
                <div key={provId} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-slate-800">{prov.nombre}</div>
                      {prov.rubro_especialidad && <div className="text-xs text-slate-400">{prov.rubro_especialidad}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-500 text-lg">{fmt(total, moneda)}</div>
                      <div className="text-xs text-slate-400">total pagado</div>
                    </div>
                  </div>
                  {pendiente > 0 && <div className="badge-warning inline-block mb-2">{fmt(pendiente, moneda)} pendiente</div>}
                  <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                    {pagos.slice(0, 4).map(p => (
                      <div key={p.id} className="flex justify-between text-xs text-slate-500">
                        <span>{p.fecha} · {p.descripcion?.slice(0, 30)}</span>
                        <span className={p.estado === 'pagado' ? 'text-red-400' : 'text-amber-400'}>{fmt(p.monto, moneda)}</span>
                      </div>
                    ))}
                    {pagos.length > 4 && <div className="text-xs text-slate-400">+{pagos.length - 4} más</div>}
                  </div>
                </div>
              );
            })}
            {egresos.filter(e => e.proveedor_id).length === 0 && (
              <div className="col-span-2 card text-center py-12 text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p>No hay egresos asignados a proveedores</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ADICIONALES */}
      {tab === 'Adicionales' && (
        <div className="space-y-4">
          {/* KPIs */}
          {(() => {
            const totalAdic = adicionales.reduce((s, a) => s + a.monto, 0);
            const aprobados = adicionales.filter(a => a.estado === 'aprobado').reduce((s, a) => s + a.monto, 0);
            const cobrados = adicionales.filter(a => a.cobrado).reduce((s, a) => s + a.monto, 0);
            const pendCobro = adicionales.filter(a => a.estado === 'aprobado' && !a.cobrado).reduce((s, a) => s + a.monto, 0);
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total adicionales', value: fmt(totalAdic, moneda), color: 'text-slate-700', bg: 'bg-slate-50' },
                  { label: 'Aprobados', value: fmt(aprobados, moneda), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Cobrados', value: fmt(cobrados, moneda), color: 'text-primary', bg: 'bg-green-50' },
                  { label: 'Pendiente cobro', value: fmt(pendCobro, moneda), color: pendCobro > 0 ? 'text-amber-600' : 'text-slate-400', bg: 'bg-amber-50' },
                ].map(s => (
                  <div key={s.label} className={`card flex flex-col gap-1 ${s.bg} border-0`}>
                    <div className="text-xs text-slate-500">{s.label}</div>
                    <div className={`font-bold text-base ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{adicionales.length} adicional{adicionales.length !== 1 ? 'es' : ''} · Fuera del presupuesto original</p>
            <button onClick={openCreateAdicional} className="btn-primary flex items-center gap-2"><Plus size={15} /> Nuevo adicional</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Descripción</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Factura</th>
                <th className="pb-2">Cobrado</th>
                <th className="pb-2 text-right">Monto</th>
                <th className="pb-2"></th>
              </tr></thead>
              <tbody>
                {adicionales.map(a => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 text-slate-400 whitespace-nowrap">{a.fecha}</td>
                    <td className="py-2 max-w-[220px] truncate">{a.descripcion}</td>
                    <td className="py-2">
                      <span className={a.estado === 'aprobado' ? 'badge-success' : a.estado === 'rechazado' ? 'badge-danger' : 'badge-warning'}>{a.estado}</span>
                    </td>
                    <td className="py-2 text-slate-400">{a.numero_factura || '-'}</td>
                    <td className="py-2">
                      <span className={a.cobrado ? 'badge-success' : 'text-slate-300 text-xs'}>{a.cobrado ? 'Sí' : 'No'}</span>
                    </td>
                    <td className="py-2 text-right font-bold text-slate-700">{fmt(a.monto, moneda)}</td>
                    <td className="py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEditAdicional(a)} className="text-slate-300 hover:text-primary"><Edit size={14} /></button>
                        <button onClick={() => delAdicional(a.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {adicionales.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-400">Sin adicionales registrados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL INGRESO */}
      {modalIngreso && (
        <Modal title={editingIngreso ? 'Editar ingreso' : 'Registrar ingreso'} onClose={() => setModalIngreso(false)}>
          <div className="space-y-4">
            <div><label className="label">Fecha *</label><input type="date" className="input" value={formIngreso.fecha} onChange={e => setFormIngreso(f => ({ ...f, fecha: e.target.value }))} /></div>
            <div><label className="label">Monto *</label><input type="number" className="input" value={formIngreso.monto} onChange={e => setFormIngreso(f => ({ ...f, monto: e.target.value }))} placeholder="0" /></div>
            <div><label className="label">Tipo</label>
              <select className="input" value={formIngreso.tipo} onChange={e => setFormIngreso(f => ({ ...f, tipo: e.target.value }))}>
                {TIPOS_INGRESO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">N° Cuota</label><input type="number" className="input" value={formIngreso.numero_cuota} onChange={e => setFormIngreso(f => ({ ...f, numero_cuota: e.target.value }))} placeholder="Ej: 1" /></div>
            <div><label className="label">Descripción</label><input className="input" value={formIngreso.descripcion} onChange={e => setFormIngreso(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej: Pago cuota 1 cliente" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setModalIngreso(false)} className="btn-secondary">Cancelar</button>
            <button onClick={saveIngreso} className="btn-primary" disabled={!formIngreso.monto || !formIngreso.fecha}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* MODAL EGRESO */}
      {modalEgreso && (
        <Modal title={editingEgreso ? 'Editar egreso' : 'Registrar egreso'} onClose={() => setModalEgreso(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Fecha *</label><input type="date" className="input" value={formEgreso.fecha} onChange={e => setFormEgreso(f => ({ ...f, fecha: e.target.value }))} /></div>
            <div><label className="label">Monto *</label><input type="number" className="input" value={formEgreso.monto} onChange={e => setFormEgreso(f => ({ ...f, monto: e.target.value }))} placeholder="0" /></div>
            <div className="col-span-2"><label className="label">Descripción *</label><input className="input" value={formEgreso.descripcion} onChange={e => setFormEgreso(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej: Compra de hierro" /></div>
            <div><label className="label">Rubro</label>
              <select className="input" value={formEgreso.rubro_id} onChange={e => setFormEgreso(f => ({ ...f, rubro_id: e.target.value }))}>
                <option value="">Sin rubro</option>
                {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div><label className="label">Proveedor</label>
              <select className="input" value={formEgreso.proveedor_id} onChange={e => setFormEgreso(f => ({ ...f, proveedor_id: e.target.value }))}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div><label className="label">N° Factura</label><input className="input" value={formEgreso.numero_factura} onChange={e => setFormEgreso(f => ({ ...f, numero_factura: e.target.value }))} placeholder="Ej: A-0001" /></div>
            <div><label className="label">Estado</label>
              <select className="input" value={formEgreso.estado} onChange={e => setFormEgreso(f => ({ ...f, estado: e.target.value }))}>
                {ESTADOS_EGRESO.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setModalEgreso(false)} className="btn-secondary">Cancelar</button>
            <button onClick={saveEgreso} className="btn-primary" disabled={!formEgreso.monto || !formEgreso.fecha || !formEgreso.descripcion}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* MODAL RUBRO */}
      {modalRubro && (
        <Modal title={editingRubro ? 'Editar rubro' : 'Nuevo rubro'} onClose={() => setModalRubro(false)}>
          <div className="space-y-4">
            <div><label className="label">Nombre *</label><input className="input" value={formRubro.nombre} onChange={e => setFormRubro(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Estructura" /></div>
            <div><label className="label">Presupuesto</label><input type="number" className="input" value={formRubro.presupuesto} onChange={e => setFormRubro(f => ({ ...f, presupuesto: e.target.value }))} placeholder="0" /></div>
            <div><label className="label">Color</label><input type="color" className="input h-10" value={formRubro.color} onChange={e => setFormRubro(f => ({ ...f, color: e.target.value }))} /></div>
            <div><label className="label">Descripción</label><textarea className="input" rows={2} value={formRubro.descripcion} onChange={e => setFormRubro(f => ({ ...f, descripcion: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setModalRubro(false)} className="btn-secondary">Cancelar</button>
            <button onClick={saveRubro} className="btn-primary" disabled={!formRubro.nombre}>Guardar</button>
          </div>
        </Modal>
      )}

      {/* MODAL CATÁLOGO */}
      {modalCatalogo && (
        <Modal title="Agregar rubros desde catálogo" onClose={() => setModalCatalogo(false)} wide>
          <p className="text-sm text-slate-500 mb-4">Seleccioná los rubros que aplican a esta obra y asignales un presupuesto.</p>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {catalogo.map(c => (
              <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${seleccionados[c.id]?.checked ? 'border-primary/40 bg-primary/5' : 'border-slate-100'}`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary"
                  checked={seleccionados[c.id]?.checked || false}
                  onChange={e => setSeleccionados(s => ({ ...s, [c.id]: { ...s[c.id], checked: e.target.checked } }))}
                />
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="font-medium text-slate-700 flex-1">{c.nombre}</span>
                {seleccionados[c.id]?.checked && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Presupuesto</label>
                    <input
                      type="number"
                      className="input w-36 text-sm py-1"
                      placeholder="0"
                      value={seleccionados[c.id].presupuesto}
                      onChange={e => setSeleccionados(s => ({ ...s, [c.id]: { ...s[c.id], presupuesto: e.target.value } }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setModalCatalogo(false)} className="btn-secondary">Cancelar</button>
            <button
              onClick={agregarDesdeCatalogo}
              className="btn-primary"
              disabled={!catalogo.some(c => seleccionados[c.id]?.checked)}
            >
              Agregar seleccionados
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL ADICIONAL */}
      {modalAdicional && (
        <Modal title={editingAdicional ? 'Editar adicional' : 'Nuevo adicional'} onClose={() => setModalAdicional(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Fecha *</label><input type="date" className="input" value={formAdicional.fecha} onChange={e => setFormAdicional((f: any) => ({ ...f, fecha: e.target.value }))} /></div>
            <div><label className="label">Monto *</label><input type="number" className="input" value={formAdicional.monto} onChange={e => setFormAdicional((f: any) => ({ ...f, monto: e.target.value }))} placeholder="0" /></div>
            <div className="col-span-2"><label className="label">Descripción *</label><input className="input" value={formAdicional.descripcion} onChange={e => setFormAdicional((f: any) => ({ ...f, descripcion: e.target.value }))} placeholder="Ej: Ampliación de living" /></div>
            <div><label className="label">Estado</label>
              <select className="input" value={formAdicional.estado} onChange={e => setFormAdicional((f: any) => ({ ...f, estado: e.target.value }))}>
                {ESTADOS_ADICIONAL.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">N° Factura</label><input className="input" value={formAdicional.numero_factura} onChange={e => setFormAdicional((f: any) => ({ ...f, numero_factura: e.target.value }))} placeholder="Ej: A-0001" /></div>
            <div className="col-span-2 flex items-center gap-3">
              <input type="checkbox" id="cobrado" className="w-4 h-4 accent-primary" checked={formAdicional.cobrado} onChange={e => setFormAdicional((f: any) => ({ ...f, cobrado: e.target.checked }))} />
              <label htmlFor="cobrado" className="label cursor-pointer mb-0">Ya cobrado</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setModalAdicional(false)} className="btn-secondary">Cancelar</button>
            <button onClick={saveAdicional} className="btn-primary" disabled={!formAdicional.monto || !formAdicional.fecha || !formAdicional.descripcion}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
