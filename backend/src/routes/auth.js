const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'obra-finanzas-secret-2026';

// Crear tabla de usuarios si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT DEFAULT 'editor',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Agregar columna usuario_id a ingresos y egresos (si no existe)
try { db.exec('ALTER TABLE ingresos ADD COLUMN usuario_id INTEGER'); } catch {}
try { db.exec('ALTER TABLE egresos ADD COLUMN usuario_id INTEGER'); } catch {}

// Middleware de autenticación exportado
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

// POST /api/auth/register  (solo admins pueden crear usuarios — o primer uso)
router.post('/register', (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan campos' });

  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) return res.status(409).json({ error: 'El email ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?,?,?,?)')
    .run(nombre, email, hash, rol || 'editor');

  res.json({ id: result.lastInsertRowid, nombre, email, rol: rol || 'editor' });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
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

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// GET /api/auth/usuarios  (solo admin)
router.get('/usuarios', authMiddleware, (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
  const users = db.prepare('SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at').all();
  res.json(users);
});

// DELETE /api/auth/usuarios/:id  (solo admin)
router.delete('/usuarios/:id', authMiddleware, (req, res) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'No podés eliminarte a vos mismo' });
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = { router, authMiddleware, JWT_SECRET };
