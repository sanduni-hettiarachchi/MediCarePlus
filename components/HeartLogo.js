import React from 'react';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

export default function HeartLogo({
  width = 80,
  height,
  gradientColors = ['#7FA68B', '#5E8B6C'],
  style,
}) {
  const logoHeight = height || width * 0.88;
  const gradId = `heartGrad_${(gradientColors[0] + gradientColors[1]).replace(/#/g, '')}`;

  return (
    <Svg width={width} height={logoHeight} viewBox="0 0 100 90" style={style}>
      <Defs>
        <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={gradientColors[0]} />
          <Stop offset="100%" stopColor={gradientColors[1]} />
        </SvgGradient>
      </Defs>
      {/* Outer gradient heart */}
      <Path
        d="M 50 85 C 10 50, 0 25, 25 10 C 38 2, 47 12, 50 20 C 53 12, 62 2, 75 10 C 100 25, 90 50, 50 85 Z"
        fill={`url(#${gradId})`}
      />
      {/* Inner white heart hole */}
      <Path
        d="M 50 67 C 27 43, 20 23, 33 14 C 40 9, 47 17, 50 22 C 53 17, 60 9, 67 14 C 80 23, 73 43, 50 67 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
