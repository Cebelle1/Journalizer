import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import NavigationDrawer from './src/components/NavigationDrawer';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { loadFonts } from './src/styles/Font.js';
import { TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  const [isViewingEntry, setIsViewingEntry] = useState(false); // Track View Journal Entry screen to show Search Icon

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
          options={{ 
            headerShown: !isCreatingEntry,    // Hide header if creating entry
            headerRight: () => (
              isViewingEntry && (
                <TouchableOpacity style={{ marginRight: 15 }}>
                  <Ionicons name="search" size={24} color="black" />
                </TouchableOpacity>
              )
            )
          }} 
        >
          {() => (
            <JournalStack 
              setIsCreatingEntry={setIsCreatingEntry}   
              setIsViewingEntry={setIsViewingEntry}
              isViewingEntry={isViewingEntry}
            />
          )}
        </Drawer.Screen>
        <Drawer.Screen name="Cloud Sync" component={CloudSyncScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const JournalStack = ({ setIsCreatingEntry, setIsViewingEntry, isViewingEntry }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="JournalScreen"
        component={JournalScreen}
        options={{ headerShown: false }} // Hide header for Journal Screen
        listeners={{
          focus: () => {
            setIsCreatingEntry(false) // Show Drawer Header
            setIsViewingEntry(true)   // Show Search Icon
          },
          blur: () => {
            setIsViewingEntry(false)  // Reset to false when blurred
            setIsCreatingEntry(true)  // Reset to true when blurred
          }
        }}
      />
      <Stack.Screen
        name="Create Journal Entry"
        component={CreateJournalEntryScreen}
        listeners={{
          focus: () => {
            setIsCreatingEntry(true)  // Hide Drawer Header
            setIsViewingEntry(false)  // Hide Search Icon
          },
          blur: () => {
            setIsCreatingEntry(false) // Reset to false when blurred
            setIsViewingEntry(true)   // Reset to true when blurred
          }, 
        }}
        options={{ headerShown: true }} // Show Stack header for Create Journal Entry
      />
    </Stack.Navigator>
  );
};