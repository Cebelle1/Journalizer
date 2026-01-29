import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FontSizeContext = createContext();

export const FontSizeProvider = ({ children }) => {
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Load font size preference from AsyncStorage on mount
  useEffect(() => {
    const loadFontSizePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem('fontSizeMultiplier');
        if (saved !== null) {
          setFontSizeMultiplier(parseFloat(saved));
        }
      } catch (error) {
        console.error('Error loading font size preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFontSizePreference();
  }, []);

  const updateFontSize = async (multiplier) => {
    try {
      setFontSizeMultiplier(multiplier);
      await AsyncStorage.setItem('fontSizeMultiplier', multiplier.toString());
    } catch (error) {
      console.error('Error saving font size preference:', error);
    }
  };

  return (
    <FontSizeContext.Provider value={{ fontSizeMultiplier, updateFontSize, isLoading }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = React.useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within FontSizeProvider');
  }
  return context;
};
