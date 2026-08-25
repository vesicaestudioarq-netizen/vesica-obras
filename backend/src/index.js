const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const { router: authRouter, authMiddleware } = require('./routes/auth');

app.use('/api/auth', authRouter);
app.use('/api/obras', authMiddleware, require('./routes/obras'));
app.use('/api/adicionales', authMiddleware, require('./routes/adicionales'));
app.use('/api/rubros', authMiddleware, require('./routes/rubros'));
app.use('/api/proveedores', authMiddleware, require('./routes/proveedores'));

app.get('/api/transacciones/exportar/:obraId', (req, res, next) => {
  if (req.query.token) req.headers.authorization = `Bearer ${req.query.token}`;
  next();
}, authMiddleware, require('./routes/transacciones'));
app.use('/api/transacciones', authMiddleware, require('./routes/transacciones'));

app.get('/api/setup/needed', async (req, res) => {
  const { query } = require('./db');
  const result = await query('SELECT COUNT(*) as c FROM usuarios');
  res.json({ needed: Number(result.rows[0].c) === 0 });
});

app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;

initDB().then(() => {
  app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
}).catch(err => {
  console.error('Error iniciando base de datos:', err);
  process.exit(1);
});
