const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const result = await query('SELECT * FROM proveedores ORDER BY nombre');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { nombre, rubro_especialidad, contacto, email, telefono, cuit } = req.body;
  const result = await query(
    'INSERT INTO proveedores (nombre, rubro_especialidad, contacto, email, telefono, cuit) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [nombre, rubro_especialidad, contacto, email, telefono, cuit]
  );
  res.json({ id: result.rows[0].id });
});

router.put('/:id', async (req, res) => {
  const { nombre, rubro_especialidad, contacto, email, telefono, cuit } = req.body;
  await query('UPDATE proveedores SET nombre=$1, rubro_especialidad=$2, contacto=$3, email=$4, telefono=$5, cuit=$6 WHERE id=$7',
    [nombre, rubro_especialidad, contacto, email, telefono, cuit, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM proveedores WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

router.get('/:id/pagos/:obraId', async (req, res) => {
  const result = await query(`
    SELECT e.*, r.nombre as rubro_nombre FROM egresos e
    LEFT JOIN rubros r ON r.id = e.rubro_id
    WHERE e.proveedor_id=$1 AND e.obra_id=$2 ORDER BY e.fecha DESC
  `, [req.params.id, req.params.obraId]);
  const pagos = result.rows;
  const total = pagos.reduce((s, p) => s + p.monto, 0);
  res.json({ pagos, total });
});

module.exports = router;
