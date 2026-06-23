const express = require('express');
const router = express.Router();
const db = require('../db');
const XLSX = require('xlsx');

// INGRESOS
router.get('/ingresos/:obraId', (req, res) => {
  const rows = db.prepare('SELECT * FROM ingresos WHERE obra_id=? ORDER BY fecha DESC').all(req.params.obraId);
  res.json(rows);
});

router.post('/ingresos', (req, res) => {
  const { obra_id, fecha, monto, descripcion, tipo, numero_cuota } = req.body;
  const result = db.prepare('INSERT INTO ingresos (obra_id, fecha, monto, descripcion, tipo, numero_cuota) VALUES (?,?,?,?,?,?)')
    .run(obra_id, fecha, monto, descripcion, tipo || 'cuota', numero_cuota);
  res.json({ id: result.lastInsertRowid });
});

router.put('/ingresos/:id', (req, res) => {
  const { fecha, monto, descripcion, tipo, numero_cuota } = req.body;
  db.prepare('UPDATE ingresos SET fecha=?, monto=?, descripcion=?, tipo=?, numero_cuota=? WHERE id=?')
    .run(fecha, monto, descripcion, tipo, numero_cuota, req.params.id);
  res.json({ ok: true });
});

router.delete('/ingresos/:id', (req, res) => {
  db.prepare('DELETE FROM ingresos WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// EGRESOS
router.get('/egresos/:obraId', (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, r.nombre as rubro_nombre, p.nombre as proveedor_nombre
    FROM egresos e
    LEFT JOIN rubros r ON r.id = e.rubro_id
    LEFT JOIN proveedores p ON p.id = e.proveedor_id
    WHERE e.obra_id=? ORDER BY e.fecha DESC
  `).all(req.params.obraId);
  res.json(rows);
});

router.post('/egresos', (req, res) => {
  const { obra_id, rubro_id, proveedor_id, fecha, monto, descripcion, numero_factura, estado } = req.body;
  const result = db.prepare('INSERT INTO egresos (obra_id, rubro_id, proveedor_id, fecha, monto, descripcion, numero_factura, estado) VALUES (?,?,?,?,?,?,?,?)')
    .run(obra_id, rubro_id || null, proveedor_id || null, fecha, monto, descripcion, numero_factura, estado || 'pagado');
  res.json({ id: result.lastInsertRowid });
});

router.put('/egresos/:id', (req, res) => {
  const { rubro_id, proveedor_id, fecha, monto, descripcion, numero_factura, estado } = req.body;
  db.prepare('UPDATE egresos SET rubro_id=?, proveedor_id=?, fecha=?, monto=?, descripcion=?, numero_factura=?, estado=? WHERE id=?')
    .run(rubro_id || null, proveedor_id || null, fecha, monto, descripcion, numero_factura, estado, req.params.id);
  res.json({ ok: true });
});

router.delete('/egresos/:id', (req, res) => {
  db.prepare('DELETE FROM egresos WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// EXPORTAR Excel
router.get('/exportar/:obraId', (req, res) => {
  const obraId = req.params.obraId;
  const obra = db.prepare('SELECT * FROM obras WHERE id=?').get(obraId);
  if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

  const ingresos = db.prepare('SELECT fecha, monto, descripcion, tipo, numero_cuota FROM ingresos WHERE obra_id=? ORDER BY fecha').all(obraId);
  const egresos = db.prepare(`
    SELECT e.fecha, e.monto, e.descripcion, e.estado, e.numero_factura, r.nombre as rubro, p.nombre as proveedor
    FROM egresos e LEFT JOIN rubros r ON r.id=e.rubro_id LEFT JOIN proveedores p ON p.id=e.proveedor_id
    WHERE e.obra_id=? ORDER BY e.fecha
  `).all(obraId);
  const rubros = db.prepare(`
    SELECT r.nombre, r.presupuesto,
      COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id=r.id AND estado='pagado'),0) as gastado
    FROM rubros r WHERE r.obra_id=?
  `).all(obraId);

  const wb = XLSX.utils.book_new();

  const wsIngresos = XLSX.utils.json_to_sheet(ingresos.map(i => ({
    Fecha: i.fecha, Monto: i.monto, Descripción: i.descripcion, Tipo: i.tipo, 'N° Cuota': i.numero_cuota
  })));
  XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos');

  const wsEgresos = XLSX.utils.json_to_sheet(egresos.map(e => ({
    Fecha: e.fecha, Monto: e.monto, Descripción: e.descripcion, Rubro: e.rubro,
    Proveedor: e.proveedor, Estado: e.estado, 'N° Factura': e.numero_factura
  })));
  XLSX.utils.book_append_sheet(wb, wsEgresos, 'Egresos');

  const wsRubros = XLSX.utils.json_to_sheet(rubros.map(r => ({
    Rubro: r.nombre, Presupuesto: r.presupuesto, Gastado: r.gastado,
    Disponible: r.presupuesto - r.gastado, '% Ejecutado': r.presupuesto > 0 ? ((r.gastado / r.presupuesto) * 100).toFixed(1) + '%' : '-'
  })));
  XLSX.utils.book_append_sheet(wb, wsRubros, 'Rubros');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${obra.nombre}-finanzas.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

module.exports = router;
