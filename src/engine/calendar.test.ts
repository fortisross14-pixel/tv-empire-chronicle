import { monthOf, weekOfMonth, periodOf, isSweeps } from './calendar';

test('52 weeks map onto 12 months', () => {
  expect(monthOf(1)).toBe(0);
  expect(monthOf(52)).toBe(11);
  const counts = Array(12).fill(0);
  for (let w = 1; w <= 52; w++) counts[monthOf(w)]++;
  counts.forEach((c) => expect(c === 4 || c === 5).toBe(true));
  expect(weekOfMonth(1)).toBe(1);
});

test('periods and sweeps', () => {
  expect(periodOf(27).id).toBe('summer');
  expect(periodOf(37).id).toBe('fall');
  expect(isSweeps(6)).toBe(true);
  expect(isSweeps(27)).toBe(false);
});
