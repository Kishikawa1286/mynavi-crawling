export const sequentialExcution = async <T, S>(
  array: T[],
  f: (value: T) => Promise<S | undefined>,
  waitFor = 0
) => {
  const resultArray = [] as Array<Awaited<S>>;
  for (const item of array) {
    // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, waitFor));
    // eslint-disable-next-line no-await-in-loop
    const result = await f(item);
    if (result) {
      resultArray.push(result);
    }
  }

  return resultArray;
};
