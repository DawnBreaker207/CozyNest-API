import z from 'zod';

const couponSchema = z.object({
  name: z.string(),
  couponCode: z.string(),
  couponValue: z.string().default(''),
  couponStartDate: z.string().default(''),
  couponEndDate: z.string(),
  status: z.boolean().default(true),
});

export { couponSchema };
