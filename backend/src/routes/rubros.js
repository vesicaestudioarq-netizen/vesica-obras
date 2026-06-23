const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/obra/:obraId', (req, res) => {
  const rubros = db.prepare(`
    SELECT r.*,
      COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id = r.id AND estado='pagado'), 0) as gastado,
      COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id = r.id AND estado='pendiente'), 0) as pendiente
    FROM rubros r WHERE r.obra_id = ? ORDER BY r.nombre
  `).all(req.params.obraId);
  res.json(rubros);
});

router.post('/', (req, res) => {
  const { obra_id, nombre, presupuesto, descripcion, color } = req.body;
  const result = db.prepare('INSERT INTO rubros (obra_id, nombre, presupuesto, descripcion, color) VALUES (?,?,?,?,?)')
    .run(obra_id, nombre, presupuesto || 0, descripcion, color || '#6366f1');
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { nombre, presupuesto, descripcion, color } = req.body;
  db.prepare('UPDATE rubros SET nombre=?, presupuesto=?, descripcion=?, color=? WHERE id=?')
    .run(nombre, presupuesto, descripcion, color, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM rubros WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
