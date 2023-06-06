export const promiseWithTimeout = <T>(ms: number, promise: Promise<T>) => {
  const timeout = new Promise((resolve, reject) =>
    setTimeout(() => reject(`Timed out after ${ms} ms.`), ms)
  );
  return Promise.race([promise, timeout]);
};
