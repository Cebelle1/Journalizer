import React from 'react';
import { useLoadFont } from './src/utils/useLoadResources.js';
import { AppNavigator } from './src/navigation/AppNavigator.js';

export default function App() {
  const fontsLoaded = useLoadFont();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppNavigator />
  );
}

