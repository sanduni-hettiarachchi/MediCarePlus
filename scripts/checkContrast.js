import colors from '../theme/colors.js';

function luminance(hex) {
  const channels = hex.replace('#', '').match(/.{2}/g).map((value) => parseInt(value, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

let failed = false;
for (const pair of colors.contrastPairs) {
  const first = luminance(pair.foreground);
  const second = luminance(pair.background);
  const ratio = (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  const passed = ratio >= pair.minimum;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${pair.name}: ${ratio.toFixed(2)}:1 (min ${pair.minimum}:1)`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
