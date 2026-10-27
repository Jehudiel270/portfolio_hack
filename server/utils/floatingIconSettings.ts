import { z } from 'zod';
import { defaultFloatingIconSettings } from '../../composables/usePortfolioData';

export const floatingIconSettingsSchema = z.object({
  enabled: z.boolean(),
  maxIcons: z.coerce.number().int().min(1).max(16),
  opacity: z.coerce.number().int().min(5).max(50),
  speed: z.coerce.number().min(0.5).max(2),
  layer: z.enum(['behind-background', 'above-background', 'foreground']).default('above-background'),
  minSize: z.coerce.number().int().min(16).max(128).default(defaultFloatingIconSettings.minSize),
  maxSize: z.coerce.number().int().min(16).max(128).default(defaultFloatingIconSettings.maxSize),
  minDuration: z.coerce.number().min(1).max(30).default(defaultFloatingIconSettings.minDuration),
  maxDuration: z.coerce.number().min(1).max(30).default(defaultFloatingIconSettings.maxDuration),
  minSpawnIntervalMs: z.coerce.number().int().min(250).max(20_000).default(defaultFloatingIconSettings.minSpawnIntervalMs),
  maxSpawnIntervalMs: z.coerce.number().int().min(250).max(20_000).default(defaultFloatingIconSettings.maxSpawnIntervalMs),
  maxRotation: z.coerce.number().int().min(0).max(45).default(defaultFloatingIconSettings.maxRotation),
  floatDistance: z.coerce.number().int().min(0).max(80).default(defaultFloatingIconSettings.floatDistance),
  icons: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    icon: z.string().trim().min(1).max(120),
  })).max(30),
}).superRefine((settings, context) => {
  for (const [minKey, maxKey] of [
    ['minSize', 'maxSize'],
    ['minDuration', 'maxDuration'],
    ['minSpawnIntervalMs', 'maxSpawnIntervalMs'],
  ] as const) {
    if (settings[minKey] > settings[maxKey]) {
      context.addIssue({
        code: 'custom',
        path: [maxKey],
        message: 'La valeur maximale doit être supérieure ou égale à la valeur minimale.',
      });
    }
  }
});
