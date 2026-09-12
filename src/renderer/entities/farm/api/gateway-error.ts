import { GatewayProblemError } from '@shared/api';

export const getGatewayErrorMessage = (error: unknown): string => {
  if (error instanceof GatewayProblemError) {
    const description = error.problem.detail ?? error.problem.title;
    return error.problem.code ? `${error.problem.code}: ${description}` : description;
  }
  if (error instanceof Error) return error.message;
  return 'Gateway request failed for an unknown reason.';
};
