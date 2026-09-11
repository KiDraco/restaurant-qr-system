const { z } = require('zod');

const themeConfigSchema = z.object({
  logo_url: z.string().url('URL de logo inválida').optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color primary debe ser hex'),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color secondary debe ser hex'),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color background debe ser hex'),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color text debe ser hex'),
  }).optional(),
  font_family: z.string().optional(),
  background_type: z.enum(['color', 'image', 'gradient']),
  background_value: z.string().optional(),
});

const themeSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  is_active: z.boolean().default(false),
  is_default: z.boolean().default(false),
  config: themeConfigSchema,
});

const themeCreateSchema = themeSchema.omit({ is_active: true, is_default: true });
const themeUpdateSchema = themeSchema.partial();

module.exports = {
  themeConfigSchema,
  themeSchema,
  themeCreateSchema,
  themeUpdateSchema
};