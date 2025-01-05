import { useEffect, useState } from "react";
import { loadFonts } from "../styles/Font";
import * as SplashScreen from 'expo-splash-screen';

export const useLoadFont = () => {
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
      SplashScreen.setOptions({
        duration: 1000,
        fade: true,
      });

      const loadResources = async () => {
        try {
          await SplashScreen.preventAutoHideAsync();  // Prevent splash screen from hiding
          await loadFonts();
          setFontsLoaded(true);
        } catch (error) {
          console.log('Error loading resources:', error);
        } finally {
          SplashScreen.hideAsync();  // Hide splash screen
        }
          
      };
      loadResources();
    }, []);

    return fontsLoaded;
}