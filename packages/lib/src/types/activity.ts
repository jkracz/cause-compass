import * as z from "zod";

export const ActivitySchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type Activity = z.infer<typeof ActivitySchema>;
