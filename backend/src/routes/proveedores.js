const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const proveedores = db.prepare('SELECT * FROM proveedores ORDER BY nombre').all();
  res.json(proveedores);
});

router.post('/', (req, res) => {
  const { nombre, rubro_especialidad, contacto, email, telefono, cuit } = req.body;
  const result = db.prepare('INSERT INTO proveedores (nombre, rubro_especialidad, contacto, email, telefono, cuit) VALUES (?,?,?,?,?,?)')
    .run(nombre, rubro_especialidad, contacto, email, telefono, cuit);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { nombre, rubro_especialidad, contacto, email, telefono, cuit } = req.body;
  db.prepare('UPDATE proveedores SET nombre=?, rubro_especialidad=?, contacto=?, email=?, telefono=?, cuit=? WHERE id=?')
    .run(nombre, rubro_especialidad, contacto, email, telefono, cuit, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM proveedores WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Pagos por proveedor en una obra
router.get('/:id/pagos/:obraId', (req, res) => {
  const pagos = db.prepare(`
    SELECT e.*, r.nombre as rubro_nombre FROM egresos e
    LEFT JOIN rubros r ON r.id = e.rubro_id
    WHERE e.proveedor_id=? AND e.obra_id=? ORDER BY e.fecha DESC
  `).all(req.params.id, req.params.obraId);
  const total = pagos.reduce((s, p) => s + p.monto, 0);
  res.json({ pagos, total });
});

module.exports = router;
