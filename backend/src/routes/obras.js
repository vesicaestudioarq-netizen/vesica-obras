const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const obras = db.prepare(`
    SELECT o.*,
      COALESCE((SELECT SUM(monto) FROM ingresos WHERE obra_id = o.id), 0) as total_ingresos,
      COALESCE((SELECT SUM(monto) FROM egresos WHERE obra_id = o.id AND estado = 'pagado'), 0) as total_egresos
    FROM obras o ORDER BY o.created_at DESC
  `).all();
  res.json(obras);
});

router.get('/:id', (req, res) => {
  const obra = db.prepare('SELECT * FROM obras WHERE id = ?').get(req.params.id);
  if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });
  res.json(obra);
});

router.post('/', (req, res) => {
  const { nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato, moneda, tipo_cashflow, estado } = req.body;
  const result = db.prepare(`
    INSERT INTO obras (nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato, moneda, tipo_cashflow, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato || 0, moneda || 'ARS', tipo_cashflow || 'mensual', estado || 'activa');
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato, moneda, tipo_cashflow, estado } = req.body;
  db.prepare(`
    UPDATE obras SET nombre=?, cliente=?, descripcion=?, fecha_inicio=?, fecha_fin_estimada=?, monto_contrato=?, moneda=?, tipo_cashflow=?, estado=?
    WHERE id=?
  `).run(nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato, moneda, tipo_cashflow, estado, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM obras WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Resumen financiero completo de una obra
router.get('/:id/resumen', (req, res) => {
  const id = req.params.id;
  const obra = db.prepare('SELECT * FROM obras WHERE id = ?').get(id);
  if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

  const totalIngresos = db.prepare('SELECT COALESCE(SUM(monto),0) as total FROM ingresos WHERE obra_id=?').get(id).total;
  const totalEgresos = db.prepare("SELECT COALESCE(SUM(monto),0) as total FROM egresos WHERE obra_id=? AND estado='pagado'").get(id).total;
  const egresosPendientes = db.prepare("SELECT COALESCE(SUM(monto),0) as total FROM egresos WHERE obra_id=? AND estado='pendiente'").get(id).total;

  const saldoCaja = totalIngresos - totalEgresos;
  const porCobrar = (obra.monto_contrato || 0) - totalIngresos;

  const rubros = db.prepare(`
    SELECT r.*,
      COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id = r.id AND estado='pagado'), 0) as gastado,
      COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id = r.id AND estado='pendiente'), 0) as pendiente
    FROM rubros r WHERE r.obra_id = ?
  `).all(id);

  res.json({ obra, totalIngresos, totalEgresos, egresosPendientes, saldoCaja, porCobrar, rubros });
});

// Cash flow agrupado por período
router.get('/:id/cashflow', (req, res) => {
  const id = req.params.id;
  const obra = db.prepare('SELECT tipo_cashflow FROM obras WHERE id = ?').get(id);
  if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

  const fmt = obra.tipo_cashflow === 'semanal'
    ? "strftime('%Y-W%W', fecha)"
    : "strftime('%Y-%m', fecha)";

  const ingresos = db.prepare(`
    SELECT ${fmt} as periodo, SUM(monto) as total FROM ingresos WHERE obra_id=? GROUP BY periodo ORDER BY periodo
  `).all(id);

  const egresos = db.prepare(`
    SELECT ${fmt} as periodo, SUM(monto) as total FROM egresos WHERE obra_id=? AND estado='pagado' GROUP BY periodo ORDER BY periodo
  `).all(id);

  const periodos = [...new Set([...ingresos.map(r => r.periodo), ...egresos.map(r => r.periodo)])].sort();
  const cashflow = periodos.map(p => {
    const ingreso = ingresos.find(r => r.periodo === p)?.total || 0;
    const egreso = egresos.find(r => r.periodo === p)?.total || 0;
    return { periodo: p, ingresos: ingreso, egresos: egreso, neto: ingreso - egreso };
  });

  let acumulado = 0;
  const cashflowAcumulado = cashflow.map(row => {
    acumulado += row.neto;
    return { ...row, acumulado };
  });

  res.json(cashflowAcumulado);
});

module.exports = router;
