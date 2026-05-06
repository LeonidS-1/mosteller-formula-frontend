/**
 * Как [inv/internal/app/repository/prescription.go](inv/internal/app/repository/prescription.go) CalculatePediatricDose:
 * BSA Mosteller, доза = BSA * dose_per_m2_mg, не выше max_daily_mg.
 */
export function calculatePediatricDoseMg(
  heightCm: number,
  weightKg: number,
  dosePerM2Mg: number,
  maxDailyMg: number,
): number {
  const h = Math.trunc(heightCm);
  const w = Math.trunc(weightKg);
  if (h <= 0 || w <= 0) {
    return 0;
  }
  const bsa = Math.sqrt((h * w) / 3600);
  let dose = bsa * dosePerM2Mg;
  if (dose > maxDailyMg) {
    dose = maxDailyMg;
  }
  return Math.round(dose * 10) / 10;
}
