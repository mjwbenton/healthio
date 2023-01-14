const ARGS_SYMBOL = Symbol.for("args");

export function withForwardedArgs<T extends object>(args: any, result: T): T {
  (result as any)[ARGS_SYMBOL] = args;
  return result;
}

export function getForwardedArgs<Args>(parent: unknown): Args {
  const args = (parent as any)[ARGS_SYMBOL];
  if (!args) {
    throw new Error("Not able to get forwarded args");
  }
  return args;
}
