const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/:obraId', async (req, res) => {
  const result = await query('SELECT * FROM adicionales WHERE obra_id=$1 ORDER BY fecha DESC', [req.params.obraId]);
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { obra_id, fecha, monto, descripcion, estado, cobrado, numero_factura } = req.body;
  const result = await query(
    'INSERT INTO adicionales (obra_id, fecha, monto, descripcion, estado, cobrado, numero_factura) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [obra_id, fecha, monto, descripcion, estado || 'pendiente', !!cobrado, numero_factura || null]
  );
  res.json({ id: result.rows[0].id });
});

router.put('/:id', async (req, res) => {
  const { fecha, monto, descripcion, estado, cobrado, numero_factura } = req.body;
  await query('UPDATE adicionales SET fecha=$1, monto=$2, descripcion=$3, estado=$4, cobrado=$5, numero_factura=$6 WHERE id=$7',
    [fecha, monto, descripcion, estado, !!cobrado, numero_factura || null, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM adicionales WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
