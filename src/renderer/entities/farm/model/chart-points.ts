export const toChartPoints = (values: readonly number[]): string => {
  if (values.length < 2) return '';
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 720;
      const y = 180 - ((value - minimum) / range) * 160;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};
