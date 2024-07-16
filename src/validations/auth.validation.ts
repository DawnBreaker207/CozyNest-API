import z from 'zod';

const registerSchema = z
  .object({
    username: z.string().min(3, { message: 'Required Username' }).max(50),
    email: z.string().email().min(1, { message: 'Required Email' }),
    password: z.string().min(6, { message: 'Required password' }).max(100),
    confirmPass: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPass, {
    message: 'Password not match',
    path: ['confirmPass'],
  });
const loginSchema = z.object({
  email: z.string().email().min(1, { message: 'Required Email' }),
  password: z.string().min(6, { message: 'RRequired password' }).max(100),
});

export { registerSchema, loginSchema };
