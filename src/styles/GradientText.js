import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';

{/* Gradient Text from (Darker) Left to Right (Lighter)*/}
export const GradientTextLR = ({ text, gradientColors, style }) => (
  <Svg height="40" width="200">
    <Defs>
      <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        {gradientColors.map((color, index) => (
          <Stop offset={`${(index / (gradientColors.length - 1)) * 100}%`} stopColor={color} key={index} />
        ))}
      </SvgLinearGradient>
    </Defs>
    <SvgText
      fill="url(#gradient)"
      fontSize="22"
      fontWeight="bold"
      x="0"
      y="30"
      {...style}
    >
      {text}
    </SvgText>
  </Svg>
);

{/* Gradient Text from (Darker) Right to Left (Lighter)*/}
export const GradientTextRL = ({ text, gradientColors, style }) => (
    <Svg height="40" width="200">
      <Defs>
        <SvgLinearGradient id="gradient" x1="100%" y1="0%" x2="0%" y2="0%">
          {gradientColors.map((color, index) => (
            <Stop offset={`${(index / (gradientColors.length - 1)) * 100}%`} stopColor={color} key={index} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradient)"
        fontSize="22"
        fontWeight="bold"
        x="0"
        y="30"
        {...style}
      >
        {text}
      </SvgText>
    </Svg>
  );

{/* Gradient Text from (Darker) Bottom to Top (Lighter)*/}
export const GradientTextBT = ({ text, gradientColors, style }) => (
    <Svg height="40" width="200">
      <Defs>
        <SvgLinearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
          {gradientColors.map((color, index) => (
            <Stop offset={`${(index / (gradientColors.length - 1)) * 100}%`} stopColor={color} key={index} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradient)"
        fontSize="22"
        fontWeight="bold"
        x="0"
        y="30"
        {...style}
      >
        {text}
      </SvgText>
    </Svg>
  );

{/* Gradient Text from (Darker) Top to Bottom (Lighter)*/}
export const GradientTextTB = ({ text, gradientColors, style }) => (
    <Svg height="40" width="200">
      <Defs>
        <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          {gradientColors.map((color, index) => (
            <Stop offset={`${(index / (gradientColors.length - 1)) * 100}%`} stopColor={color} key={index} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        fill="url(#gradient)"
        fontSize="22"
        fontWeight="bold"
        x="0"
        y="30"
        {...style}
      >
        {text}
      </SvgText>
    </Svg>
  );
