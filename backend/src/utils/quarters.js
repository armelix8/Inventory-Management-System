/**
 * Fiscal quarter from date:
 * Q1: July - end September + year
 * Q2: October - end December + year
 * Q3: January - end March + year
 * Q4: April - end June + year
 */
export function getQuarterFromDate(d) {
  const date = d ? new Date(d) : new Date();
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  let q;
  if (month >= 7 && month <= 9) q = 1;
  else if (month >= 10 && month <= 12) q = 2;
  else if (month >= 1 && month <= 3) q = 3;
  else q = 4; // April, May, June
  return `Q${q} ${year}`;
}
