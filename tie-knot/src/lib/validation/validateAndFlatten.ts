import z from "zod";

type ValidationResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: Partial<Record<keyof T, string[]>> };

export const validateAndFlatten = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): ValidationResult<T> => {
  const result = schema.safeParse(data);

  return result.success
    ? { success: true as const, data: result.data }
    : {
        success: false as const,
        error: z.flattenError(result.error).fieldErrors,
      };
};
