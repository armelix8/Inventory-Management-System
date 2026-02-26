/**
 * Fiscal quarter from date:
 * Q1: July–Sept, Q2: Oct–Dec, Q3: Jan–Mar, Q4: Apr–Jun
 */
export function getQuarterFromDate(d) {
  const date = d ? new Date(d) : new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let q;
  if (month >= 7 && month <= 9) q = 1;
  else if (month >= 10 && month <= 12) q = 2;
  else if (month >= 1 && month <= 3) q = 3;
  else q = 4;
  return `Q${q} ${year}`;
}
