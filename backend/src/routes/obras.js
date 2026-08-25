const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const result = await query(`
    SELECT o.*,
      COALESCE((SELECT SUM(monto) FROM ingresos WHERE obra_id = o.id), 0) as total_ingresos,
      COALESCE((SELECT SUM(monto) FROM egresos WHERE obra_id = o.id AND estado = 'pagado'), 0) as total_egresos
    FROM obras o ORDER BY o.created_at DESC
  `);
  res.json(result.rows);
});

router.get('/:id', async (req, res) => {
  const result = await query('SELECT * FROM obras WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Obra no encontrada' });
  res.json(result.rows[0]);
});

router.post('/', async (req, res) => {
  const { nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato, moneda, tipo_cashflow, estado } = req.body;
  const result = await query(`
    INSERT INTO obras (nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato, moneda, tipo_cashflow, estado)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
  `, [nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato || 0, moneda || 'ARS', tipo_cashflow || 'mensual', estado || 'activa']);
  res.json({ id: result.rows[0].id });
});

router.put('/:id', async (req, res) => {
  const { nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato, moneda, tipo_cashflow, estado } = req.body;
  await query(`
    UPDATE obras SET nombre=$1, cliente=$2, descripcion=$3, fecha_inicio=$4, fecha_fin_estimada=$5,
      monto_contrato=$6, moneda=$7, tipo_cashflow=$8, estado=$9 WHERE id=$10
  `, [nombre, cliente, descripcion, fecha_inicio, fecha_fin_estimada, monto_contrato, moneda, tipo_cashflow, estado, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM obras WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

router.get('/:id/resumen', async (req, res) => {
  const id = req.params.id;
  const obraRes = await query('SELECT * FROM obras WHERE id = $1', [id]);
  const obra = obraRes.rows[0];
  if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

  const [ingRes, egrPagRes, egrPendRes, rubRes] = await Promise.all([
    query('SELECT COALESCE(SUM(monto),0) as total FROM ingresos WHERE obra_id=$1', [id]),
    query("SELECT COALESCE(SUM(monto),0) as total FROM egresos WHERE obra_id=$1 AND estado='pagado'", [id]),
    query("SELECT COALESCE(SUM(monto),0) as total FROM egresos WHERE obra_id=$1 AND estado='pendiente'", [id]),
    query(`
      SELECT r.*,
        COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id = r.id AND estado='pagado'), 0) as gastado,
        COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id = r.id AND estado='pendiente'), 0) as pendiente
      FROM rubros r WHERE r.obra_id = $1
    `, [id]),
  ]);

  const totalIngresos = Number(ingRes.rows[0].total);
  const totalEgresos = Number(egrPagRes.rows[0].total);
  const egresosPendientes = Number(egrPendRes.rows[0].total);
  const saldoCaja = totalIngresos - totalEgresos;
  const porCobrar = (obra.monto_contrato || 0) - totalIngresos;
  const rubros = rubRes.rows.map(r => ({
    ...r,
    gastado: Number(r.gastado),
    pendiente: Number(r.pendiente),
  }));

  res.json({ obra, totalIngresos, totalEgresos, egresosPendientes, saldoCaja, porCobrar, rubros });
});

router.get('/:id/cashflow', async (req, res) => {
  const id = req.params.id;
  const obraRes = await query('SELECT tipo_cashflow FROM obras WHERE id = $1', [id]);
  if (!obraRes.rows[0]) return res.status(404).json({ error: 'Obra no encontrada' });

  const tipo = obraRes.rows[0].tipo_cashflow;
  const fmt = tipo === 'semanal'
    ? "TO_CHAR(fecha::date, 'IYYY-\"W\"IW')"
    : "TO_CHAR(fecha::date, 'YYYY-MM')";

  const [ingRes, egrRes] = await Promise.all([
    query(`SELECT ${fmt} as periodo, SUM(monto) as total FROM ingresos WHERE obra_id=$1 GROUP BY periodo ORDER BY periodo`, [id]),
    query(`SELECT ${fmt} as periodo, SUM(monto) as total FROM egresos WHERE obra_id=$1 AND estado='pagado' GROUP BY periodo ORDER BY periodo`, [id]),
  ]);

  const ingresos = ingRes.rows;
  const egresos = egrRes.rows;
  const periodos = [...new Set([...ingresos.map(r => r.periodo), ...egresos.map(r => r.periodo)])].sort();
  const cashflow = periodos.map(p => {
    const ingreso = Number(ingresos.find(r => r.periodo === p)?.total || 0);
    const egreso = Number(egresos.find(r => r.periodo === p)?.total || 0);
    return { periodo: p, ingresos: ingreso, egresos: egreso, neto: ingreso - egreso };
  });

  let acumulado = 0;
  res.json(cashflow.map(row => { acumulado += row.neto; return { ...row, acumulado }; }));
});

module.exports = router;
