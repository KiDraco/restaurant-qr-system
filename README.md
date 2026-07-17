# 🍽️ Sistema de Gestión de Restaurante con Códigos QR

Sistema completo para gestionar mesas de restaurante mediante códigos QR, permitiendo a los clientes llamar al mesero, solicitar la cuenta y ver su consumo en tiempo real.

## 📋 Características

### Para Clientes
- ✅ Escaneo de código QR por mesa
- 📞 Llamar al mesero con un botón
- 💰 Solicitar cuenta
- 📊 Ver total consumido y detalle de órdenes
- 📱 Interfaz responsive y moderna

### Para Administradores
- 📈 Dashboard en tiempo real
- 🔔 Gestión de solicitudes pendientes
- 👥 Visualización de mesas activas
- 💵 Estadísticas de ventas diarias
- 📋 Gestión de menú y productos

## 🏗️ Estructura del Proyecto

```
restaurant-qr-system/
├── backend/          # API REST con Node.js + Express + SQLite
└── frontend/         # Aplicación React con Tailwind CSS
```

## 🚀 Instalación

### Requisitos Previos
- Node.js >= 14.0.0
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone 
cd restaurant-qr-system
```

### 2. Instalar Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:
```bash
PORT=3000
NODE_ENV=development
DATABASE_PATH=./restaurant.db
FRONTEND_URL=http://localhost:3001
APP_URL=http://localhost:3001
```

### 3. Instalar Frontend

```bash
cd ../frontend
npm install
```

Crear archivo `.env`:
```bash
REACT_APP_API_URL=http://localhost:3000/api
PORT=3001
```

## 🎯 Uso

### Iniciar el Backend

```bash
cd backend
npm start
# o para desarrollo con auto-reload
npm run dev
```

El servidor estará corriendo en `http://localhost:3000`

### Iniciar el Frontend

```bash
cd frontend
npm start
```

La aplicación estará disponible en `http://localhost:3001`

## 📡 API Endpoints

### Mesas
- `POST /api/tables/generate` - Generar mesas
- `GET /api/tables` - Listar todas las mesas
- `GET /api/tables/:qrCode` - Obtener mesa por QR
- `GET /api/tables/:qrCode/qr-image` - Generar imagen QR

### Solicitudes
- `POST /api/requests` - Crear solicitud
- `GET /api/requests/pending` - Solicitudes pendientes
- `PATCH /api/requests/:id/attend` - Marcar como atendida

### Sesiones
- `POST /api/sessions/start` - Iniciar sesión de mesa
- `GET /api/sessions/table/:tableNumber` - Sesión activa
- `POST /api/sessions/:sessionId/close` - Cerrar sesión

### Menú
- `POST /api/menu` - Agregar producto
- `GET /api/menu` - Listar menú
- `PUT /api/menu/:id` - Actualizar producto
- `DELETE /api/menu/:id` - Eliminar producto

### Órdenes
- `POST /api/orders` - Crear orden
- `GET /api/orders/table/:tableNumber/bill` - Ver cuenta de mesa

### Estadísticas
- `GET /api/requests/stats` - Estadísticas de solicitudes
- `GET /api/orders/stats` - Estadísticas de ventas

## 🛠️ Configuración Inicial

### 1. Generar Mesas

```bash
curl -X POST http://localhost:3000/api/tables/generate \
  -H "Content-Type: application/json" \
  -d '{"numberOfTables": 20}'
```

### 2. Agregar Productos al Menú

```bash
# Pizza
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Margherita",
    "description": "Muzzarella, tomate y albahaca",
    "price": 8500,
    "category": "Pizzas"
  }'

# Bebida
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca Cola",
    "description": "500ml",
    "price": 1500,
    "category": "Bebidas"
  }'
```

### 3. Simular una Orden

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": 5,
    "menuItemId": 1,
    "quantity": 2
  }'
```

## 📱 Rutas del Frontend

- `/` - Vista del cliente (escaneo QR)
- `/admin` - Panel de administración
- `/table/:qrCode` - Vista de mesa específica

## 🗂️ Arquitectura

### Backend
- **MVC Pattern**: Separación clara entre Modelos, Controladores y Rutas
- **SQLite**: Base de datos ligera y sin configuración
- **Express**: Framework web minimalista
- **RESTful API**: API bien estructurada y documentada

### Frontend
- **React**: Componentes reutilizables
- **Tailwind CSS**: Estilos modernos y responsive
- **React Router**: Navegación entre vistas
- **Lucide React**: Iconos modernos

## 🔧 Scripts Disponibles

### Backend
- `npm start` - Iniciar servidor
- `npm run dev` - Iniciar en modo desarrollo

### Frontend
- `npm start` - Iniciar aplicación
- `npm run build` - Compilar para producción
- `npm test` - Ejecutar tests

## 📦 Dependencias Principales

### Backend
- express: Framework web
- sqlite3: Base de datos
- qrcode: Generación de códigos QR
- cors: Habilitar CORS
- uuid: Generación de IDs únicos

### Frontend
- react: Librería UI
- react-router-dom: Enrutamiento
- lucide-react: Iconos
- tailwindcss: Estilos

## 🚧 Próximas Mejoras

- [ ] Autenticación y autorización
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Sistema de reservas
- [ ] Propinas digitales
- [ ] Múltiples métodos de pago
- [ ] Análisis y reportes avanzados
- [ ] Notificaciones push
- [ ] App móvil nativa

## 📄 Licencia

MIT

## 👥 Autor

Tu Nombre - [Tu Email]

## 🙏 Agradecimientos

Creado con ❤️ para mejorar la experiencia en restaurantes