import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createDrawerNavigator } from '@react-navigation/drawer';
import NavigationDrawer from './src/components/NavigationDrawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
// Screens
import JournalScreen from './src/screens/JournalScreen.js';
import SettingsScreen from './src/screens/SettingsScreen.js';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Journals" drawerContent={(props) => <NavigationDrawer {...props} />}>
        <Drawer.Screen name="Journals" component={JournalScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f00',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
