import { z } from 'zod';

export const contactInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().max(180).default(''),
  message: z.string().trim().min(10).max(6000),
  website: z.string().max(0).optional().default(''),
}).transform(({ website: _website, ...message }) => message);
