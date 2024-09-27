import z from 'zod';

export const mailSchema = z.object({
  email: z.string().email().trim(),
  subject: z.string().trim(),
  content: z.string().trim(),
});
