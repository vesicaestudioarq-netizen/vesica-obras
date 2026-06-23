import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../lib/api';
import { TrendingUp, TrendingDown, HardHat, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Obra {
  id: number; nombre: string; cliente: string; estado: string;
  monto_contrato: number; moneda: string; total_ingresos: number; total_egresos: number;
}

export default function Dashboard() {
  const [obras, setObras] = useState<Obra[]>([]);

  useEffect(() => { api.getObras().then(setObras); }, []);

  const totalContrato = obras.reduce((s, o) => s + (o.monto_contrato || 0), 0);
  const totalIngresos = obras.reduce((s, o) => s + (o.total_ingresos || 0), 0);
  const totalEgresos = obras.reduce((s, o) => s + (o.total_egresos || 0), 0);
  const saldoCaja = totalIngresos - totalEgresos;
  const activas = obras.filter(o => o.estado === 'activa').length;

  const stats = [
    { label: 'Obras activas', value: activas, icon: HardHat, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total facturado', value: fmt(totalContrato), icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Total cobrado', value: fmt(totalIngresos), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total pagado', value: fmt(totalEgresos), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Saldo en caja', value: fmt(saldoCaja), icon: saldoCaja >= 0 ? CheckCircle2 : AlertCircle, color: saldoCaja >= 0 ? 'text-emerald-600' : 'text-red-500', bg: saldoCaja >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen financiero de todas las obras</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card flex flex-col gap-2">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            <div className={`font-bold text-lg leading-tight ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-700">Obras</h2>
          <Link to="/obras" className="text-sm text-primary hover:underline">Ver todas →</Link>
        </div>
        <div className="grid gap-3">
          {obras.length === 0 && (
            <div className="card text-center text-slate-400 py-10">
              No hay obras. <Link to="/obras" className="text-primary hover:underline">Crear una obra</Link>
            </div>
          )}
          {obras.map(o => {
            const saldo = (o.total_ingresos || 0) - (o.total_egresos || 0);
            const pctCobrado = o.monto_contrato > 0 ? ((o.total_ingresos / o.monto_contrato) * 100) : 0;
            return (
              <Link key={o.id} to={`/obras/${o.id}`} className="card hover:shadow-md transition-shadow block">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{o.nombre}</div>
                    <div className="text-sm text-slate-400">{o.cliente}</div>
                  </div>
                  <span className={o.estado === 'activa' ? 'badge-success' : 'badge-warning'}>{o.estado}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400 text-xs">Contrato</div>
                    <div className="font-semibold">{fmt(o.monto_contrato, o.moneda)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Cobrado</div>
                    <div className="font-semibold text-emerald-600">{fmt(o.total_ingresos || 0, o.moneda)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Saldo caja</div>
                    <div className={`font-semibold ${saldo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(saldo, o.moneda)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>% Cobrado del contrato</span>
                    <span>{pctCobrado.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(pctCobrado, 100)}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
