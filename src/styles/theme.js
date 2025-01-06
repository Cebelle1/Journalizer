import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { min } from "date-fns";

export const themeStyle = {
    darkPurple1: '#3d3b60',
    darkPurple2: '#623c73',
    darkPurple3: '#7f6f9c',
    darkPurple4: '#3d3b60',
    darkPurple5: '#6c549c',
    lightPurple1: '#c599c7',
    lightPurple2: '#c1bdce',
    lightPurple3: '#c4b9c8',
    lightPurpleTint: '#efecf2',
    brown: '#73545c',
    white: '#ffffff',
    black: '#000',
    darkGrey1: '#6B7280',
    lightGrey1: '#E5E7EB',
    lightGrey2: '#D2D2D2',
    beigeWhite1: '#f3f3ec',
    coffeeBrown: '#755a52',
    lightBrown: '#b19c93',
    lightBrownTint: '#D6CCC7',
    darkBrown: '#54342A',
    darkBrown2: '#2B130C',
    darkBrown3: '#3F1D12',
    brightBrown: '#964C32',
    lightRed: '#FFC6C6',
    
};

export const pastelRainbowTheme = {
    purple: '#F4F1FF',
    blue: '#E5FCFF',
    yellow: '#FEFCFC',
    green: '#E8FAD7',
    orange: '#FFE4CC',
    red: '#F7DFDF',
}

export const themeStyleSet = StyleSheet.create({
    navigatorBackground: themeStyle.lightBrown,
    navigatorHeader: themeStyle.white,
    navigatorHeaderTitle: themeStyle.black,
})

export function ThemeBackground({ children }) {
  return(
    <LinearGradient
        colors={[pastelRainbowTheme.purple, pastelRainbowTheme.blue, pastelRainbowTheme.red]}
        start={{ x: 0.5, y: 0 }} 
        end={{ x: 0.5, y: 1 }}   
        style={{ flex:1 }}
    >
      {children}
    </LinearGradient> 
  )
}