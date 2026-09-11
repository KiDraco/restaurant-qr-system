const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento: guardar en public/uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    // Nombre seguro: timestamp + nombre original sin extensiones peligrosas
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_') + '-' + uniqueSuffix + ext;
    cb(null, safeName);
  }
});

// Filtros: solo aceptar imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG, WebP, SVG.'), false);
  }
};

// Límite: 5MB por archivo
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/upload/image - Sube una imagen de logo/fondo
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    // Retornar URL pública relativa (el frontend la unirá con el dominio)
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload/images - Sube múltiples imágenes (para usar en el futuro)
router.post('/multiple', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }
    const urls = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ urls, filenames: req.files.map(f => f.filename) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;