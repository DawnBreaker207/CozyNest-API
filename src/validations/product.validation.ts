import z from 'zod';

export const productSchema = z.object({
  name: z.string().min(3, { message: 'Required name product' }),
  categoryId: z.string().min(1, { message: 'Required category on product' }),
  SKU: z.string().min(1, { message: 'Required SKU' }),
  brand: z.string(),
  thumbnail: z.string().optional(),
  description: z.string(),
  price: z.number().min(3, { message: 'Required base price product' }),
});

export const categorySchema = z.object({
  name: z.string().min(1, { message: 'Required name category' }),
  thumbnail: z.string().optional(),
});
