import z from 'zod';

const productSchema = z.object({
  name: z.string().min(3, { message: 'Required name product' }),
  category: z.string().min(1, { message: 'Required category on product' }),
  brand: z.string(),
  thumbnail: z.string().optional(),
  description: z.string(),
  base_price: z.number().min(3, { message: 'Required base price product' }),
});

const categorySchema = z.object({
  name: z.string().min(1, { message: 'Required name category' }),
  thumbnail: z.string().optional(),
});
const variantSchema = z.object({
  name: z.string().min(3, { message: 'Required name product' }),
  extra_price: z.number().min(3, { message: 'Required base price product' }),
  size: z.string().min(1, { message: 'Required size on variant' }),
  color: z.string().min(1, { message: 'Required color on variant' }),
  thumbnail: z.string().optional(),
  stock: z.number().min(1, { message: 'Required stock on variant' }),
});

export { productSchema, variantSchema, categorySchema };
