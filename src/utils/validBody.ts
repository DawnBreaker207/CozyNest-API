import { ZodSchema } from 'zod';

const validBody = (data: Request, isSchema: ZodSchema) => {
  const { error } = isSchema.safeParse(data);
  if (error) {
    const errors = error.errors.map((item) => item.message);
    return errors;
  }
  return;
};
