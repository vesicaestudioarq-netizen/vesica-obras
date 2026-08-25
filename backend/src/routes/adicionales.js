const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:obraId', (req, res) => {
  const rows = db.prepare('SELECT * FROM adicionales WHERE obra_id=? ORDER BY fecha DESC').all(req.params.obraId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { obra_id, fecha, monto, descripcion, estado, cobrado, numero_factura } = req.body;
  const result = db.prepare(
    'INSERT INTO adicionales (obra_id, fecha, monto, descripcion, estado, cobrado, numero_factura) VALUES (?,?,?,?,?,?,?)'
  ).run(obra_id, fecha, monto, descripcion, estado || 'pendiente', cobrado ? 1 : 0, numero_factura || null);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { fecha, monto, descripcion, estado, cobrado, numero_factura } = req.body;
  db.prepare('UPDATE adicionales SET fecha=?, monto=?, descripcion=?, estado=?, cobrado=?, numero_factura=? WHERE id=?')
    .run(fecha, monto, descripcion, estado, cobrado ? 1 : 0, numero_factura || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM adicionales WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
