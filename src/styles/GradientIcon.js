import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Mask, Rect, Text } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import MatCommIcon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * GradientIcon Component
 * @param {string} name - The icon name from the library.
 * @param {number} size - The size of the icon.
 * @param {array} gradientColors - The gradient colors (array of strings).
 * @param {object} IconComponent - The icon component from the library.
 * @param {object} style - Additional styles for the container.
 */

{/* Gradient Icon from (Darker) Left to Right (Lighter)*/}
export const GradientIconLR = ({ name, size, gradientColors, IconComponent, style }) => {
    // Get the font family of the icon component
    const fontFamily = IconComponent.getFontFamily();
  
    // Get the Unicode character of the icon
    const iconCode = IconComponent.getRawGlyphMap()[name];
  
    if (!iconCode) {
      console.warn(`Icon "${name}" not found in the provided IconComponent.`);
      return null;
    }
  
    return (
      <View style={[styles.iconContainer, style]}>
        <Svg height={size+10} width={size} >
          <Defs>
            <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {gradientColors.map((color, index) => (
                <Stop offset={`${(index / (gradientColors.length - 1)) * 100}%`} stopColor={color} key={index} />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Text
            x="50%"
            y="70%"
            alignmentBaseline="middle"
            textAnchor="middle"
            fontSize={size}
            fontFamily={fontFamily}
            fill="url(#gradient)"
          >
            {String.fromCharCode(iconCode)}
          </Text>
        </Svg>
      </View>
    );
  };

{/* Gradient Icon from (Darker) Right to Left (Lighter)*/}
export const GradientIconRL = ({ name, size, gradientColors, IconComponent, style }) => {
    // Get the font family of the icon component
    const fontFamily = IconComponent.getFontFamily();
  
    // Get the Unicode character of the icon
    const iconCode = IconComponent.getRawGlyphMap()[name];
  
    if (!iconCode) {
      console.warn(`Icon "${name}" not found in the provided IconComponent.`);
      return null;
    }
  
    return (
      <View style={[styles.iconContainer, style]}>
        <Svg height={size+10} width={size} >
          <Defs>
            <SvgLinearGradient id="gradient" x1="100%" y1="0%" x2="0%" y2="0%">
              {gradientColors.map((color, index) => (
                <Stop offset={`${(index / (gradientColors.length - 1)) * 100}%`} stopColor={color} key={index} />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Text
            x="50%"
            y="70%"
            alignmentBaseline="middle"
            textAnchor="middle"
            fontSize={size}
            fontFamily={fontFamily}
            fill="url(#gradient)"
          >
            {String.fromCharCode(iconCode)}
          </Text>
        </Svg>
      </View>
    );
  };

{/* Gradient Icon from (Darker) Top to Bottom (Lighter)*/}
export const GradientIconTB = ({ name, size, gradientColors, IconComponent, style }) => {
    // Get the font family of the icon component
    const fontFamily = IconComponent.getFontFamily();
  
    // Get the Unicode character of the icon
    const iconCode = IconComponent.getRawGlyphMap()[name];
  
    if (!iconCode) {
      console.warn(`Icon "${name}" not found in the provided IconComponent.`);
      return null;
    }
  
    return (
      <View style={[styles.iconContainer, style]}>
        <Svg height={size+10} width={size} >
          <Defs>
            <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              {gradientColors.map((color, index) => (
                <Stop offset={`${(index / (gradientColors.length - 1)) * 100}%`} stopColor={color} key={index} />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Text
            x="50%"
            y="70%"
            alignmentBaseline="middle"
            textAnchor="middle"
            fontSize={size}
            fontFamily={fontFamily}
            fill="url(#gradient)"
          >
            {String.fromCharCode(iconCode)}
          </Text>
        </Svg>
      </View>
    );
  };

{/* Gradient Icon from (Darker) Bottom to Top (Lighter)*/}
export const GradientIconBT = ({ name, size, gradientColors, IconComponent, style }) => {
    // Get the font family of the icon component
    const fontFamily = IconComponent.getFontFamily();
  
    // Get the Unicode character of the icon
    const iconCode = IconComponent.getRawGlyphMap()[name];
  
    if (!iconCode) {
      console.warn(`Icon "${name}" not found in the provided IconComponent.`);
      return null;
    }
  
    return (
      <View style={[styles.iconContainer, style]}>
        <Svg height={size+10} width={size} >
          <Defs>
            <SvgLinearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
              {gradientColors.map((color, index) => (
                <Stop offset={`${(index / (gradientColors.length - 1)) * 100}%`} stopColor={color} key={index} />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Text
            x="50%"
            y="70%"
            alignmentBaseline="middle"
            textAnchor="middle"
            fontSize={size}
            fontFamily={fontFamily}
            fill="url(#gradient)"
          >
            {String.fromCharCode(iconCode)}
          </Text>
        </Svg>
      </View>
    );
  };


const styles = StyleSheet.create({
iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
},
icon: {
    textAlign: 'center',
},
});