/** searchParams 값(string | string[] | undefined)에서 첫 문자열만 취한다. */
export function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
