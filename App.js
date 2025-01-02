import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import NavigationDrawer from './src/components/NavigationDrawer';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { loadFonts } from './src/styles/Font.js';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as SplashScreen from 'expo-splash-screen';
import { themeStyle

 } from './src/styles/theme.js';
// Screens
import JournalScreen from './src/screens/JournalScreen.js';
import CloudSyncScreen from './src/screens/CloudSyncScreen.js';
import SettingsScreen from './src/screens/SettingsScreen.js';
import JournalEntryScreen from './src/screens/JournalEntryScreen.js';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

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

   // Once resources are loaded, hide the splash screen
   useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Journals"
        drawerContent={(props) => <NavigationDrawer {...props} />}
        screenOptions={{
          headerStyle: drawerStyles.headerStyle,
          headerTitleStyle: drawerStyles.headerTitleStyle,
         }}
      >
        <Drawer.Screen 
          name="Journals" 
          options={{ 
            headerShown: !isCreatingEntry,    // Hide header if creating entry
            headerRight: () => (
              !isCreatingEntry && (
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
              isCreatingEntry={isCreatingEntry}
            />
          )}
        </Drawer.Screen>
        <Drawer.Screen name="Cloud Sync" component={CloudSyncScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const JournalStack = ({ setIsCreatingEntry, isCreatingEntry}) => {
  return (
    <Stack.Navigator
      initialRouteName="JournalScreen"
      screenOptions={{
        headerStyle: stackStyles.headerStyle,
        headerTitleStyle: stackStyles.headerTitleStyle,
      }}>
      <Stack.Screen
        name="JournalScreen"
        component={JournalScreen}
        options={{ headerShown: false }} // Hide header for Journal Screen
        listeners={{
          focus: () => {
            setIsCreatingEntry(false) // Show Drawer Header
          },
          blur: () => {
            setIsCreatingEntry(true)  // Reset to true when blurred
          }
        }}
      />
      <Stack.Screen
        name="Journal Entry"
        component={JournalEntryScreen}
        listeners={{
          focus: () => {
            setIsCreatingEntry(true)  // Hide Drawer Header
          },
          blur: () => {
            setIsCreatingEntry(false) // Reset to false when blurred
          }, 
        }}
        options={{ 
          headerShown: true,
          
        }} 
      />
    </Stack.Navigator>
  );
};

const drawerStyles = StyleSheet.create({
  headerStyle: {
    backgroundColor: themeStyle.lightPurple2,
    shadowColor: themeStyle.black,
  },
  headerTitleStyle: {
    fontFamily: 'Montserrat-Bold',
    color: themeStyle.black,
  },
});

const stackStyles = StyleSheet.create({
  headerStyle: {
    backgroundColor: themeStyle.lightPurple3,
    shadowColor: themeStyle.black,
  },
  headerTitleStyle: {
    fontFamily: 'Montserrat-Bold',
    color: themeStyle.black,
  },
});
