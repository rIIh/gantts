export const clamp = (val: number, min: number, max: number) => {
  if (min > max) {
    let c = min;
    min = max;
    max = c;
  } else
  if (min == max) { return min; }
  return Math.min(Math.max(val, min), max);
};
