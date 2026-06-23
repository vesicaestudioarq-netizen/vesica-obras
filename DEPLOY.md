# Deploy en Railway (acceso desde cualquier lugar)

## Paso 1 — Subir el código a GitHub

1. Crear cuenta en https://github.com
2. Crear repositorio nuevo (ej: "obra-finanzas")
3. Abrir PowerShell en C:\LAURA\obra-finanzas y ejecutar:

```
git init
git add .
git commit -m "primera version"
git remote add origin https://github.com/TU_USUARIO/obra-finanzas.git
git push -u origin main
```

## Paso 2 — Deploy en Railway

1. Entrar a https://railway.app con tu cuenta de GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Seleccionar el repo "obra-finanzas"
4. Railway detecta Node.js automáticamente

## Paso 3 — Configurar variables de entorno en Railway

En el panel de Railway → Variables → agregar:

| Variable     | Valor                        |
|-------------|------------------------------|
| NODE_ENV    | production                   |
| JWT_SECRET  | (una clave larga y secreta)  |

## Paso 4 — Configurar el build del frontend

En Railway → Settings → Build Command:
```
npm install --prefix frontend && npm run build --prefix frontend && npm install --prefix backend
```

Start Command:
```
node backend/src/index.js
```

## Paso 5 — Dominio

Railway genera un dominio automático tipo:
`https://obra-finanzas-production.up.railway.app`

Compartís ese link con todos los usuarios.

---

## Para uso en red local (sin internet)

Ejecutar el backend con:
```
node backend/src/index.js
```

Y el frontend con:
```
cd frontend && npx vite --host
```

Vite mostrará la IP local (ej: http://192.168.1.100:5173).
Cualquiera en la misma red WiFi puede entrar con esa URL.
