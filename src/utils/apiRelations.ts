export function isLoadedRelation(
  value: unknown,
): value is Record<string, unknown> & { id: string } {
  return typeof value === "object" && value !== null && "id" in value;
}

export function omitBooleanRelations<T extends object>(
  value: T,
  keys: (keyof T)[],
): T {
  const next = { ...value } as T & Record<string, unknown>;

  for (const key of keys) {
    const relation = next[key as string];
    if (relation === true || relation === false) {
      delete next[key as string];
    }
  }

  return next;
}
