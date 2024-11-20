import z from "zod";

export const articleSchema = z.object({
    title: z.string().min(1, { message: 'Required name article' }),
    images  : z.string().optional(),
    content: z.string().min(1, { message: 'Required content article' }),
});

