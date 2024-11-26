import z from 'zod';

export const optionSchema = z.object({
  name: z.string(),
  label: z.string(),
  position: z.number(),
});

export const optionValuesSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const variantSchema = z.object({
  price: z.number(),
  stock: z.number(),
  image: z.object({}).optional(),
  assets: z.array(z.any()).optional(),
  options: z.array(z.any()).optional(),
});
