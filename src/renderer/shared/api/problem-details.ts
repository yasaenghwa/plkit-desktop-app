import { z } from 'zod';

export const problemDetailsSchema = z
  .object({
    type: z.string().optional(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string().optional(),
    instance: z.string().optional(),
    code: z.string().optional(),
  })
  .readonly();

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

export class GatewayProblemError extends Error {
  readonly name = 'GatewayProblemError';

  constructor(readonly problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
  }
}
