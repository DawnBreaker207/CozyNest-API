import z from 'zod';

export const optionSchema = z.object({
  name: z.string(),
  position: z.number(),
});

export const optionValuesSchema = z.object({
  value: z.string(),
});

// export const variantSchema = z.object({
//   image: z.object({}).optional(),
// });

export const skuSchema = z.object({
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  stock: z.number(),
});
