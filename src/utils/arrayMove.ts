export function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const next = array.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
