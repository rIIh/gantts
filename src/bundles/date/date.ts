export const diffDays = (left: Date, right: Date) => {
  const negative = left.compareTo(right) > 0;
  const diffTime = Math.abs(negative ? -right.getTime() + left.getTime() : right.getTime() - left.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return negative ? -diffDays : diffDays;
};
