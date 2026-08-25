const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const { router: authRouter, authMiddleware } = require('./routes/auth');

app.use('/api/auth', authRouter);

// Todas las rutas de datos requieren autenticación
app.use('/api/obras', authMiddleware, require('./routes/obras'));
app.use('/api/adicionales', authMiddleware, require('./routes/adicionales'));
app.use('/api/rubros', authMiddleware, require('./routes/rubros'));
app.use('/api/proveedores', authMiddleware, require('./routes/proveedores'));
// Exportar Excel permite token por query param (para window.open)
app.get('/api/transacciones/exportar/:obraId', (req, res, next) => {
  if (req.query.token) req.headers.authorization = `Bearer ${req.query.token}`;
  next();
}, authMiddleware, require('./routes/transacciones'));
app.use('/api/transacciones', authMiddleware, require('./routes/transacciones'));

// Primer usuario: si no hay ningún usuario, permite crear el primero sin auth
app.get('/api/setup/needed', (req, res) => {
  const db = require('./db');
  const count = db.prepare('SELECT COUNT(*) as c FROM usuarios').get().c;
  res.json({ needed: count === 0 });
});

// Servir frontend en producción
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
