const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/obra/:obraId', async (req, res) => {
  const result = await query(`
    SELECT r.*,
      COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id = r.id AND estado='pagado'), 0) as gastado,
      COALESCE((SELECT SUM(monto) FROM egresos WHERE rubro_id = r.id AND estado='pendiente'), 0) as pendiente
    FROM rubros r WHERE r.obra_id = $1 ORDER BY r.nombre
  `, [req.params.obraId]);
  res.json(result.rows.map(r => ({ ...r, gastado: Number(r.gastado), pendiente: Number(r.pendiente) })));
});

router.post('/', async (req, res) => {
  const { obra_id, nombre, presupuesto, descripcion, color } = req.body;
  const result = await query(
    'INSERT INTO rubros (obra_id, nombre, presupuesto, descripcion, color) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [obra_id, nombre, presupuesto || 0, descripcion, color || '#6366f1']
  );
  res.json({ id: result.rows[0].id });
});

router.put('/:id', async (req, res) => {
  const { nombre, presupuesto, descripcion, color } = req.body;
  await query('UPDATE rubros SET nombre=$1, presupuesto=$2, descripcion=$3, color=$4 WHERE id=$5',
    [nombre, presupuesto, descripcion, color, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM rubros WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
