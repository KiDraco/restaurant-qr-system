# 🚀 Guía de Deployment

Esta guía te ayudará a deployar el sistema de gestión de restaurante en producción.

## 📋 Opciones de Deployment

### Opción 1: Render (Recomendado - Gratis)

#### Backend en Render

1. Crear cuenta en [Render.com](https://render.com)

2. Crear nuevo **Web Service**:
   - Repository: Tu repositorio de GitHub
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. Variables de entorno:
   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://tu-frontend.onrender.com
   APP_URL=https://tu-frontend.onrender.com
   ```

4. El backend estará disponible en: `https://tu-app.onrender.com`

#### Frontend en Render

1. Crear nuevo **Static Site**:
   - Repository: Tu repositorio de GitHub
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`

2. Variables de entorno:
   ```
   REACT_APP_API_URL=https://tu-backend.onrender.com/api
   ```

### Opción 2: Railway

1. Crear cuenta en [Railway.app](https://railway.app)

2. Crear nuevo proyecto desde GitHub

3. Configurar variables de entorno similares a Render

4. Railway detectará automáticamente Node.js y deployará

### Opción 3: Vercel (Solo Frontend) + Railway (Backend)

#### Frontend en Vercel

1. Instalar Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy desde la carpeta frontend:
   ```bash
   cd frontend
   vercel
   ```

3. Configurar variables de entorno en el dashboard de Vercel

#### Backend en Railway o Render

Seguir instrucciones de Opción 1 o 2 para el backend.

### Opción 4: VPS (DigitalOcean, AWS, etc.)

#### Requisitos
- Ubuntu 20.04+ o similar
- Node.js 14+
- Nginx como reverse proxy
- PM2 para gestión de procesos

#### Pasos

1. **Instalar dependencias en el servidor**:
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx
   sudo npm install -g pm2
   ```

2. **Clonar repositorio**:
   ```bash
   git clone <tu-repo>
   cd restaurant-qr-system
   ```

3. **Configurar Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Editar .env con tus configuraciones
   npm run seed
   ```

4. **Iniciar Backend con PM2**:
   ```bash
   pm2 start server.js --name restaurant-api
   pm2 save
   pm2 startup
   ```

5. **Configurar Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

6. **Configurar Nginx**:
   ```nginx
   # /etc/nginx/sites-available/restaurant
   
   # Backend
   server {
       listen 80;
       server_name api.tudominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   
   # Frontend
   server {
       listen 80;
       server_name tudominio.com www.tudominio.com;
       root /path/to/restaurant-qr-system/frontend/build;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

7. **Activar configuración**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/restaurant /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Configurar SSL con Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d tudominio.com -d www.tudominio.com -d api.tudominio.com
   ```

## 🔒 Seguridad en Producción

### 1. Variables de Entorno

Nunca commitear archivos `.env` al repositorio. Usar:

```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. CORS

Configurar CORS apropiadamente en producción:

```javascript
// backend/src/app.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### 3. Rate Limiting

Agregar rate limiting para prevenir abuso:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por IP
});

app.use('/api/', limiter);
```

### 4. Helmet para Headers de Seguridad

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

## 📊 Monitoreo

### PM2 Monitoring

```bash
pm2 monit
pm2 logs restaurant-api
```

### Logs en Producción

Configurar logs apropiados:

```javascript
// backend/src/app.js
const morgan = require('morgan');
app.use(morgan('combined'));
```

## 🔄 CI/CD

### GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy Backend
      run: |
        # Tus comandos de deploy
        
    - name: Deploy Frontend
      run: |
        # Tus comandos de deploy
```

## 📱 Generar Códigos QR Físicos

Una vez deployado:

1. Acceder a: `https://tu-api.com/api/tables`
2. Para cada mesa, generar el QR:
   ```
   https://tu-api.com/api/tables/{qr_code}/qr-image
   ```
3. Imprimir y colocar en las mesas

Alternativamente, usar el script:

```bash
node scripts/generate-qr-images.js
```

## 🆘 Troubleshooting

### Error: Cannot connect to database

- Verificar permisos de escritura en la carpeta
- Verificar que SQLite esté instalado

### Error: CORS

- Verificar que `FRONTEND_URL` esté correctamente configurado
- Verificar configuración de CORS en `app.js`

### Error: Port already in use

```bash
# Encontrar proceso usando el puerto
lsof -i :3000
# Matar proceso
kill -9 
```

## 📞 Soporte

Para problemas o preguntas:
- Crear un issue en GitHub
- Email: tu-email@example.com

---

**Nota**: Esta guía asume conocimientos básicos de Linux, Node.js y deployment. Para configuraciones más avanzadas, consultar la documentación oficial de cada servicio.