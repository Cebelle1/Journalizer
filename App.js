import React, { useState, useEffect } from 'react';
import { useLoadFont } from './src/utils/useLoadResources.js';
import { AppNavigator } from './src/navigation/AppNavigator.js';
import PasswordSetupScreen from './src/screens/PasswordSetupScreen.js';
import { isPasswordInitialized } from './src/services/PasswordService.js';
import { FontSizeProvider } from './src/context/FontSizeContext.js';

export default function App() {
  const fontsLoaded = useLoadFont();
  const [passwordState, setPasswordState] = useState(null); // null = loading, 'setup' = needs setup, 'initialized' = setup done

  useEffect(() => {
    checkPasswordStatus();
  }, []);

  const checkPasswordStatus = async () => {
    try {
      const initialized = await isPasswordInitialized();
      setPasswordState(initialized ? 'initialized' : 'setup');
    } catch (error) {
      console.error('Error checking password status:', error);
      // Default to setup if there's an error
      setPasswordState('setup');
    }
  };

  if (!fontsLoaded || passwordState === null) {
    return null;
  }

  // If password hasn't been set up, show setup screen
  if (passwordState === 'setup') {
    return (
      <FontSizeProvider>
        <PasswordSetupScreen 
          onPasswordSet={() => setPasswordState('initialized')}
        />
      </FontSizeProvider>
    );
  }

  // Password is initialized, show main app with prompt
  return (
    <FontSizeProvider>
      <AppNavigator initiallyPasswordVerified={false} />
    </FontSizeProvider>
  );
}

