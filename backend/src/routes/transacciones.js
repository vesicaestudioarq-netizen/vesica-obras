const express = require('express');
const router = express.Router();
const { query } = require('../db');
const XLSX = require('xlsx');

// INGRESOS
router.get('/ingresos/:obraId', async (req, res) => {
  const result = await query('SELECT * FROM ingresos WHERE obra_id=$1 ORDER BY fecha DESC', [req.params.obraId]);
  res.json(result.rows);
});

router.post('/ingresos', async (req, res) => {
  const { obra_id, fecha, monto, descripcion, tipo, numero_cuota } = req.body;
  const result = await query(
    'INSERT INTO ingresos (obra_id, fecha, monto, descripcion, tipo, numero_cuota) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [obra_id, fecha, monto, descripcion, tipo || 'cuota', numero_cuota || null]
  );
  res.json({ id: result.rows[0].id });
});

router.put('/ingresos/:id', async (req, res) => {
  const { fecha, monto, descripcion, tipo, numero_cuota } = req.body;
  await query('UPDATE ingresos SET fecha=$1, monto=$2, descripcion=$3, tipo=$4, numero_cuota=$5 WHERE id=$6',
    [fecha, monto, descripcion, tipo, numero_cuota || null, req.params.id]);
  res.json({ ok: true });
});

router.delete('/ingresos/:id', async (req, res) => {
  await query('DELETE FROM ingresos WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// EGRESOS
router.get('/egresos/:obraId', async (req, res) => {
  const result = await query(`
    SELECT e.*, r.nombre as rubro_nombre, p.nombre as proveedor_nombre
    FROM egresos e
    LEFT JOIN rubros r ON r.id = e.rubro_id
    LEFT JOIN proveedores p ON p.id = e.proveedor_id
    WHERE e.obra_id=$1 ORDER BY e.fecha DESC
  `, [req.params.obraId]);
  res.json(result.rows);
});

router.post('/egresos', async (req, res) => {
  const { obra_id, rubro_id, proveedor_id, fecha, monto, descripcion, numero_factura, estado } = req.body;
  const result = await query(
    'INSERT INTO egresos (obra_id, rubro_id, proveedor_id, fecha, monto, descripcion, numero_factura, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [obra_id, rubro_id || null, proveedor_id || null, fecha, monto, descripcion, numero_factura || null, estado || 'pagado']
  );
  res.json({ id: result.rows[0].id });
});

router.put('/egresos/:id', async (req, res) => {
  const { rubro_id, proveedor_id, fecha, monto, descripcion, numero_factura, estado } = req.body;
  await query('UPDATE egresos SET rubro_id=$1, proveedor_id=$2, fecha=$3, monto=$4, descripcion=$5, numero_factura=$6, estado=$7 WHERE id=$8',
    [rubro_id || null, proveedor_id || null, fecha, monto, descripcion, numero_factura || null, estado, req.params.id]);
  res.json({ ok: true });
});

router.delete('/egresos/:id', async (req, res) => {
  await query('DELETE FROM egresos WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// EXPORTAR Excel
router.get('/exportar/:obraId', async (req, res) => {
  const obraId = req.params.obraId;
  const obraRes = await query('SELECT * FROM obras WHERE id=$1', [obraId]);
  const obra = obraRes.rows[0];
  if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

  const [ingRes, egrRes, rubRes] = await Promise.all([
    query('SELECT fecha, monto, descripcion, tipo, numero_cuota FROM ingresos WHERE obra_id=$1 ORDER BY fecha', [obraId]),
    query(`
      SELECT e.fecha, e.monto, e.descripcion, e.estado, e.numero_factura, r.nombre as rubro, p.nombre as proveedor
      FROM egresos e LEFT JOIN rubros r ON r.id=e.rubro_id LEFT JOIN proveedores p ON p.id=e.proveedor_id
      WHERE e.obra_id=$1 ORDER BY e.fecha
    `, [obraId]),
    query(`
      SELECT r.nombre, r.presupuesto,
        COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id=r.id AND estado='pagado'),0) as gastado
      FROM rubros r WHERE r.obra_id=$1
    `, [obraId]),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ingRes.rows.map(i => ({
    Fecha: i.fecha, Monto: i.monto, Descripción: i.descripcion, Tipo: i.tipo, 'N° Cuota': i.numero_cuota
  }))), 'Ingresos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(egrRes.rows.map(e => ({
    Fecha: e.fecha, Monto: e.monto, Descripción: e.descripcion, Rubro: e.rubro,
    Proveedor: e.proveedor, Estado: e.estado, 'N° Factura': e.numero_factura
  }))), 'Egresos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rubRes.rows.map(r => ({
    Rubro: r.nombre, Presupuesto: r.presupuesto, Gastado: Number(r.gastado),
    Disponible: r.presupuesto - Number(r.gastado),
    '% Ejecutado': r.presupuesto > 0 ? ((Number(r.gastado) / r.presupuesto) * 100).toFixed(1) + '%' : '-'
  }))), 'Rubros');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${obra.nombre}-finanzas.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

module.exports = router;
