import z from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, { message: 'Required name product' }),
  thumbnail: z.string().optional(),
  category_id: z.string().min(1, { message: 'Required category on product' }),
  description: z.string(),
  // discount: z.number().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, { message: 'Required name category' }),
  thumbnail: z.string().optional(),
  type: z.string().optional(),
});
