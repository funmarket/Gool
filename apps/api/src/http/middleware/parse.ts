import type { Request } from 'express';
import type { output, ZodTypeAny } from 'zod';

export function parseBody<TSchema extends ZodTypeAny>(
  schema: TSchema,
  req: Request,
): output<TSchema> {
  return schema.parse(req.body);
}
