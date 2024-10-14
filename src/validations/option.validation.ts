import z from "zod";
export const optionSchema = z.object({
  name: z.string(),
  label: z.string(),
  position: z.number(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});
