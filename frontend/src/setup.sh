#!/bin/bash

echo "🚀 Configurando Restaurant QR System..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${BLUE}Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js no está instalado. Por favor, instala Node.js >= 14.0.0${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"
echo ""

# Instalar Backend
echo -e "${BLUE}📦 Instalando dependencias del Backend...${NC}"
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend instalado correctamente${NC}"
else
    echo -e "${YELLOW}✗ Error instalando Backend${NC}"
    exit 1
fi
echo ""

# Crear archivo .env del backend si no existe
if [ ! -f .env ]; then
    echo -e "${BLUE}Creando archivo .env del backend...${NC}"
    cat > .env << EOF
PORT=3000
NODE_ENV=development
DATABASE_PATH=./restaurant.db
FRONTEND_URL=http://localhost:3001
APP_URL=http://localhost:3001
EOF
    echo -e "${GREEN}✓ Archivo .env creado${NC}"
fi

# Poblar base de datos
echo -e "${BLUE}🌱 Poblando base de datos con datos de ejemplo...${NC}"
npm run seed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Base de datos configurada${NC}"
else
    echo -e "${YELLOW}✗ Error configurando base de datos${NC}"
fi
echo ""

# Volver a la raíz
cd ..

# Instalar Frontend
echo -e "${BLUE}📦 Instalando dependencias del Frontend...${NC}"
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend instalado correctamente${NC}"
else
    echo -e "${YELLOW}✗ Error instalando Frontend${NC}"
    exit 1
fi
echo ""

# Crear archivo .env del frontend si no existe
if [ ! -f .env ]; then
    echo -e "${BLUE}Creando archivo .env del frontend...${NC}"
    cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000/api
PORT=3001
EOF
    echo -e "${GREEN}✓ Archivo .env creado${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Instalación completada exitosamente!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Para iniciar el proyecto:${NC}"
echo ""
echo -e "1. Backend:"
echo -e "   ${YELLOW}cd backend && npm run dev${NC}"
echo ""
echo -e "2. Frontend (en otra terminal):"
echo -e "   ${YELLOW}cd frontend && npm start${NC}"
echo ""
echo -e "${BLUE}Acceder a:${NC}"
echo -e "   - Cliente: ${YELLOW}http://localhost:3001${NC}"
echo -e "   - Admin:   ${YELLOW}http://localhost:3001/admin${NC}"
echo -e "   - API:     ${YELLOW}http://localhost:3000${NC}"
echo ""