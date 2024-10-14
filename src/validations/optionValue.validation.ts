import z from "zod";
export const optionValuesSchema = z.object({
  label: z.string(),
  value: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});
