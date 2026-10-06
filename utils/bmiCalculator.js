export function calculateBmi(weightKg, heightMeters) {
  if (weightKg <= 0 || heightMeters <= 0) {
    throw new Error('Height must be greater than zero.');
  }

  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

export function getBmiCategory(bmi) {
  if (bmi < 18.5) return 'Below recommended range';
  if (bmi < 25) return 'Within recommended range';
  if (bmi < 30) return 'Above recommended range';
  return 'High range';
}
