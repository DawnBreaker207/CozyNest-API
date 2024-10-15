import z from 'zod';

export const optionSchema = z.object({
  name: z.string(),
  label: z.string(),
  position: z.number(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const optionalValuesSchema = z.object({
  label: z.string(),
  value: z.string(),
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
