const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'obra_finanzas.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS obras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    cliente TEXT NOT NULL,
    descripcion TEXT,
    fecha_inicio TEXT,
    fecha_fin_estimada TEXT,
    monto_contrato REAL DEFAULT 0,
    moneda TEXT DEFAULT 'ARS',
    tipo_cashflow TEXT DEFAULT 'mensual',
    estado TEXT DEFAULT 'activa',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rubros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obra_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    presupuesto REAL DEFAULT 0,
    descripcion TEXT,
    color TEXT DEFAULT '#6366f1',
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    rubro_especialidad TEXT,
    contacto TEXT,
    email TEXT,
    telefono TEXT,
    cuit TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ingresos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obra_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    monto REAL NOT NULL,
    descripcion TEXT,
    tipo TEXT DEFAULT 'cuota',
    numero_cuota INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS egresos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obra_id INTEGER NOT NULL,
    rubro_id INTEGER,
    proveedor_id INTEGER,
    fecha TEXT NOT NULL,
    monto REAL NOT NULL,
    descripcion TEXT NOT NULL,
    numero_factura TEXT,
    estado TEXT DEFAULT 'pagado',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
    FOREIGN KEY (rubro_id) REFERENCES rubros(id),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
  );
`);

// Tabla de adicionales (fuera del presupuesto original)
db.exec(`
  CREATE TABLE IF NOT EXISTS adicionales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obra_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    monto REAL NOT NULL,
    descripcion TEXT NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    cobrado INTEGER DEFAULT 0,
    numero_factura TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE
  );
`);

module.exports = db;
