import z from 'zod';

export const productSchema = z.object({
  name: z.string().min(3, { message: 'Required name product' }),
  categoryId: z.string().min(1, { message: 'Required category on product' }),
  brand: z.string(),
  thumbnail: z.string().optional(),
  description: z.string(),
  price: z.number().min(3, { message: 'Required base price product' }),
});

export const categorySchema = z.object({
  name: z.string().min(1, { message: 'Required name category' }),
  thumbnail: z.string().optional(),
});

export const optionValuesSchema = z.object({
  label: z.string(),
  value: z.string(),
  option_id: z.string(),
  product_id: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const optionSchema = z.object({
  name: z.string(),
  product_id: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const variantSchema = z.object({
  product_id: z.string(),
  SKU: z.string(),
  name: z.string(),
  price: z.number(),
  price_before_discount: z.number(),
  stock: z.number(),
  image: z.object({}).optional(),
  assets: z.array(z.any()).optional(),
  options: z.array(z.any()).optional(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});
