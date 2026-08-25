const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(sql, params) {
  return pool.query(sql, params);
}

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS obras (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      cliente TEXT NOT NULL,
      descripcion TEXT,
      fecha_inicio TEXT,
      fecha_fin_estimada TEXT,
      monto_contrato REAL DEFAULT 0,
      moneda TEXT DEFAULT 'ARS',
      tipo_cashflow TEXT DEFAULT 'mensual',
      estado TEXT DEFAULT 'activa',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rubros (
      id SERIAL PRIMARY KEY,
      obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      presupuesto REAL DEFAULT 0,
      descripcion TEXT,
      color TEXT DEFAULT '#6366f1'
    );

    CREATE TABLE IF NOT EXISTS proveedores (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      rubro_especialidad TEXT,
      contacto TEXT,
      email TEXT,
      telefono TEXT,
      cuit TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ingresos (
      id SERIAL PRIMARY KEY,
      obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
      fecha TEXT NOT NULL,
      monto REAL NOT NULL,
      descripcion TEXT,
      tipo TEXT DEFAULT 'cuota',
      numero_cuota INTEGER,
      usuario_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS egresos (
      id SERIAL PRIMARY KEY,
      obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
      rubro_id INTEGER REFERENCES rubros(id),
      proveedor_id INTEGER REFERENCES proveedores(id),
      fecha TEXT NOT NULL,
      monto REAL NOT NULL,
      descripcion TEXT NOT NULL,
      numero_factura TEXT,
      estado TEXT DEFAULT 'pagado',
      usuario_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT DEFAULT 'editor',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS adicionales (
      id SERIAL PRIMARY KEY,
      obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
      fecha TEXT NOT NULL,
      monto REAL NOT NULL,
      descripcion TEXT NOT NULL,
      estado TEXT DEFAULT 'pendiente',
      cobrado BOOLEAN DEFAULT FALSE,
      numero_factura TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

module.exports = { query, pool, initDB };
