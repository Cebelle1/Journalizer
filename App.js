import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import NavigationDrawer from './src/components/NavigationDrawer';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { loadFonts } from './src/styles/Font.js';

// Screens
import JournalScreen from './src/screens/JournalScreen.js';
import CloudSyncScreen from './src/screens/CloudSyncScreen.js';
import SettingsScreen from './src/screens/SettingsScreen.js';
import CreateJournalEntryScreen from './src/screens/CreateJournalEntryScreen.js';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false); // Track Create Journal Entry screen to hide Drawer Header

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
      <Drawer.Navigator
        initialRouteName="Journals"
        drawerContent={(props) => <NavigationDrawer {...props} />}
      >
        <Drawer.Screen 
          name="Journals" 
          options={{ headerShown: !isCreatingEntry }} // Hide header if creating entry
        >
          {() => (
            <JournalStack 
              setIsCreatingEntry={setIsCreatingEntry} // Set isCreatingEntry state
            />
          )}
        </Drawer.Screen>
        <Drawer.Screen name="Cloud Sync" component={CloudSyncScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const JournalStack = ({ setIsCreatingEntry }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="JournalScreen"
        component={JournalScreen}
        options={{ headerShown: false }} // Hide header for JournalScreen
        listeners={{
          focus: () => setIsCreatingEntry(false), // Reset to false when focused
        }}
      />
      <Stack.Screen
        name="Create Journal Entry"
        component={CreateJournalEntryScreen}
        options={{ headerShown: true }} // Show header for Create Journal Entry
        listeners={{
          focus: () => setIsCreatingEntry(true), // Set to true when focused
          blur: () => setIsCreatingEntry(false), // Reset to false when blurred
        }}
      />
    </Stack.Navigator>
  );
};