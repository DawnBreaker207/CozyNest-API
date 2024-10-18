import z from 'zod';

export const productSchema = z.object({
  originId: z.string().min(3),
  name: z.string().min(3, { message: 'Required name product' }),
  thumbnail: z.string().optional(),
  categoryId: z.string().min(1, { message: 'Required category on product' }),
  brand: z.string(),
  description: z.string(),
  price: z.number().min(3, { message: 'Required base price product' }),
  SKU: z.string().min(1, { message: 'Required SKU' }),
});

export const categorySchema = z.object({
  name: z.string().min(1, { message: 'Required name category' }),
  thumbnail: z.string().optional(),
  type: z.string(),
});
