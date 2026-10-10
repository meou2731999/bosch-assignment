// Check before recursive parsing so untrusted JSON cannot exhaust the stack.
export function withinBudget(
  value: unknown,
  maxDepth: number,
  maxNodes: number,
) {
  const pending = [{ value, depth: 0 }];
  let count = 0;
  while (pending.length) {
    const current = pending.pop()!;
    if (++count > maxNodes || current.depth > maxDepth) return false;
    if (current.value && typeof current.value === "object") {
      for (const child of Object.values(current.value)) {
        pending.push({ value: child, depth: current.depth + 1 });
      }
    }
  }
  return true;
}
