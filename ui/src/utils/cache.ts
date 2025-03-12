function cache<TResponse, TArgs extends unknown[]>({
  keyGenerator,
  getter,
  count = Infinity,
}: {
  keyGenerator: (...args: TArgs) => string;
  getter: (...args: TArgs) => Promise<TResponse> | TResponse;
  count?: number;
}): (...args: TArgs) => Promise<TResponse> {
  const cacheStore = new Map<string, TResponse>();

  return async (...args: TArgs): Promise<TResponse> => {
    const key = keyGenerator(...args);

    if (cacheStore.has(key)) {
      return cacheStore.get(key)!;
    }

    const result = await Promise.resolve(getter(...args));

    if (cacheStore.size >= count) {
      const oldestKey = cacheStore.keys().next().value;
      if (oldestKey) cacheStore.delete(oldestKey);
    }

    cacheStore.set(key, result);

    return result;
  };
}

export default cache;
