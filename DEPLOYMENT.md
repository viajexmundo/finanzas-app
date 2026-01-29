# Guía de Despliegue - Finanzas App

## Opciones de Despliegue

### Opción 1: VPS/Servidor con Node.js (Recomendado)

Esta app usa Next.js con SQLite, lo cual funciona mejor en un VPS donde tienes control completo.

#### Requisitos del servidor:
- Node.js 18+
- npm o yarn
- PM2 (para mantener la app corriendo)

#### Pasos:

1. **Conectar al servidor por SSH**
```bash
ssh usuario@tu-servidor.com
```

2. **Clonar o subir el proyecto**
```bash
# Si usas git
git clone tu-repositorio.git finanzas-app
cd finanzas-app

# O subir archivos via SFTP/SCP
```

3. **Instalar dependencias**
```bash
npm install
```

4. **Configurar variables de entorno**
```bash
cp .env.example .env
nano .env
```

Contenido del `.env`:
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="genera-un-secreto-seguro-aqui"
NEXTAUTH_URL="https://tu-dominio.com"
```

Para generar un secreto seguro:
```bash
openssl rand -base64 32
```

5. **Inicializar la base de datos**
```bash
npx prisma generate
npx prisma db push
```

6. **Crear usuario administrador inicial**
```bash
npx prisma db seed
# O manualmente via prisma studio:
npx prisma studio
```

7. **Construir la aplicación**
```bash
npm run build
```

8. **Iniciar con PM2**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la app
pm2 start npm --name "finanzas" -- start

# Configurar para iniciar con el sistema
pm2 startup
pm2 save
```

9. **Configurar Nginx como proxy inverso**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

10. **Configurar SSL con Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

### Opción 2: cPanel (Hosting compartido)

**Nota importante**: cPanel tradicional NO soporta Next.js directamente porque:
- No tiene Node.js como servidor persistente
- SQLite puede tener problemas de permisos
- Las rutas de API no funcionan igual

Sin embargo, algunos proveedores ofrecen "Node.js Selector" en cPanel:

#### Si tu cPanel tiene Node.js Selector:

1. **Preparar archivos para subir**
```bash
# En tu máquina local, construir la app
npm run build

# Crear archivo zip con:
# - .next/
# - node_modules/
# - package.json
# - prisma/
# - public/
# - .env
```

2. **En cPanel:**
   - Ir a "Setup Node.js App" o "Node.js Selector"
   - Crear nueva aplicación
   - Seleccionar Node.js 18+
   - Configurar el directorio raíz
   - Subir archivos via File Manager o FTP

3. **Configurar la aplicación:**
   - Application root: `/home/usuario/finanzas`
   - Application URL: tu-dominio.com
   - Application startup file: `node_modules/.bin/next`
   - Argumentos: `start`

4. **Variables de entorno** (en el panel de Node.js):
   - DATABASE_URL=file:./prisma/dev.db
   - NEXTAUTH_SECRET=tu-secreto
   - NEXTAUTH_URL=https://tu-dominio.com

5. **Ejecutar comandos** (via terminal SSH o cPanel Terminal):
```bash
cd ~/finanzas
npm install
npx prisma generate
npx prisma db push
```

---

### Opción 3: Vercel (Más fácil, pero requiere cambiar DB)

Vercel es la plataforma ideal para Next.js, pero SQLite no funciona bien porque el sistema de archivos es efímero.

**Cambios necesarios:**
1. Migrar de SQLite a PostgreSQL (Neon, Supabase, PlanetScale)
2. Actualizar `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Pasos:**
1. Crear cuenta en Vercel
2. Conectar repositorio de GitHub
3. Configurar variables de entorno en Vercel
4. Deploy automático

---

## Comandos Útiles

### Desarrollo local
```bash
npm run dev          # Iniciar en modo desarrollo
npm run build        # Construir para producción
npm start            # Iniciar en modo producción
```

### Base de datos
```bash
npx prisma generate  # Generar cliente Prisma
npx prisma db push   # Sincronizar schema con DB
npx prisma studio    # Abrir GUI de base de datos
npx prisma migrate dev --name nombre  # Crear migración
```

### PM2 (producción)
```bash
pm2 list             # Ver apps corriendo
pm2 logs finanzas    # Ver logs
pm2 restart finanzas # Reiniciar
pm2 stop finanzas    # Detener
pm2 delete finanzas  # Eliminar
```

---

## Solución de Problemas

### Error: "SQLITE_CANTOPEN"
- Verificar permisos del directorio `prisma/`
- Ejecutar: `chmod 755 prisma && chmod 644 prisma/dev.db`

### Error: "Module not found"
- Ejecutar: `npm install`
- Verificar que `node_modules` existe

### Error: "NEXTAUTH_SECRET missing"
- Agregar variable de entorno NEXTAUTH_SECRET
- Generar con: `openssl rand -base64 32`

### La app no inicia después de reiniciar servidor
- Verificar que PM2 está configurado: `pm2 startup && pm2 save`

### Errores de base de datos
- Regenerar cliente: `npx prisma generate`
- Verificar schema: `npx prisma db push`

---

## Backup y Restauración

### Backup manual de base de datos
```bash
cp prisma/dev.db prisma/dev.db.backup
```

### Usar función de backup de la app
1. Ir a Configuración > Backup y Restauración
2. Click en "Exportar"
3. Se descarga un JSON con todos los datos

### Restaurar desde backup
1. Ir a Configuración > Backup y Restauración
2. Click en "Seleccionar Archivo"
3. Seleccionar el archivo JSON de backup
4. Click en "Importar"

---

## Seguridad

1. **Cambiar la contraseña del admin por defecto**
2. **Usar HTTPS siempre** (certificado SSL)
3. **Mantener Node.js actualizado**
4. **Hacer backups regulares**
5. **No exponer la base de datos SQLite públicamente**

---

## Contacto y Soporte

Si encuentras errores:
1. Descargar logs desde Configuración > Logs del Sistema
2. Revisar los logs para identificar el problema
3. Hacer backup antes de cualquier cambio importante
