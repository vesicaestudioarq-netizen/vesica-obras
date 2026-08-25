const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'obra-finanzas-secret-2026';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Sin autorización' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

router.post('/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan campos' });

  const existe = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (existe.rows.length > 0) return res.status(409).json({ error: 'El email ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const result = await query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4) RETURNING id',
    [nombre, email, hash, rol || 'editor']
  );
  res.json({ id: result.rows[0].id, nombre, email, rol: rol || 'editor' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }
  const token = jwt.sign(
    { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

router.get('/usuarios', authMiddleware, async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
  const result = await query('SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at');
  res.json(result.rows);
});

router.delete('/usuarios/:id', authMiddleware, async (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'No podés eliminarte a vos mismo' });
  await query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = { router, authMiddleware, JWT_SECRET };
