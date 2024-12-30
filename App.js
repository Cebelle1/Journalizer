import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import NavigationDrawer from './src/components/NavigationDrawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { loadFonts } from './src/styles/Font.js';

// Screens
import JournalScreen from './src/screens/JournalScreen.js';
import CloudSyncScreen from './src/screens/CloudSyncScreen.js';
import SettingsScreen from './src/screens/SettingsScreen.js';

const Drawer = createDrawerNavigator();

export default function App() {

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();
      setFontsLoaded(true);
    };

    loadResources();
  }, []);

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Journals" drawerContent={(props) => <NavigationDrawer {...props} />}>
        <Drawer.Screen name="Journals" component={JournalScreen} />
        <Drawer.Screen name="Cloud Sync" component={CloudSyncScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}