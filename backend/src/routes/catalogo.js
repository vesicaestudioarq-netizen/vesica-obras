const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const result = await query('SELECT * FROM rubros_catalogo ORDER BY nombre');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { nombre, color, descripcion } = req.body;
  const result = await query(
    'INSERT INTO rubros_catalogo (nombre, color, descripcion) VALUES ($1,$2,$3) RETURNING id',
    [nombre, color || '#6366f1', descripcion || null]
  );
  res.json({ id: result.rows[0].id });
});

router.put('/:id', async (req, res) => {
  const { nombre, color, descripcion } = req.body;
  await query('UPDATE rubros_catalogo SET nombre=$1, color=$2, descripcion=$3 WHERE id=$4',
    [nombre, color, descripcion || null, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM rubros_catalogo WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
