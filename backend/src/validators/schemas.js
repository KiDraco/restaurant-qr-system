const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  role: z.string().optional()
});

const menuItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().default(''),
  price: z.number().positive('Precio debe ser positivo'),
  category: z.string().min(1, 'Categoría requerida'),
  image_url: z.string().url('URL inválida').optional().or(z.literal(''))
});

const menuItemUpdateSchema = menuItemSchema.partial().extend({
  available: z.boolean().optional()
});

const orderSchema = z.object({
  tableNumber: z.number().int().positive('Número de mesa inválido'),
  menuItemId: z.number().int().positive('Item de menú inválido'),
  quantity: z.number().int().positive('Cantidad debe ser positiva')
});

const promotionSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().default(''),
  discount_percentage: z.number().min(0).max(100, 'Porcentaje entre 0 y 100'),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

const promotionUpdateSchema = promotionSchema.partial();

const tableGenerateSchema = z.object({
  numberOfTables: z.number().int().positive().max(100)
});

module.exports = {
  loginSchema,
  registerSchema,
  menuItemSchema,
  menuItemUpdateSchema,
  orderSchema,
  promotionSchema,
  promotionUpdateSchema,
  tableGenerateSchema
};
