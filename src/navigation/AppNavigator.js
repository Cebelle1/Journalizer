import React, { useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { themeStyle } from '../styles/theme.js';
import NavigationDrawer from '../components/NavigationDrawer.js';
import JournalScreen from '../screens/JournalScreen.js';
import CloudSyncScreen from '../screens/CloudSyncScreen.js';
import SettingsScreen from '../screens/SettingsScreen.js';
import JournalEntryScreen from '../screens/JournalEntryScreen.js';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const JournalStack = ({ setIsCreatingEntry }) => {
  return (
    <Stack.Navigator
      initialRouteName="JournalScreen"
      screenOptions={{
        headerStyle: stackStyles.headerStyle,
        headerTitleStyle: stackStyles.headerTitleStyle,
        headerTintColor: stackStyles.headerTintColor,
      }}>
      <Stack.Screen
        name="JournalScreen"
        component={JournalScreen}
        options={{ headerShown: false }}
        listeners={{
          focus: () => setIsCreatingEntry(false),
          blur: () => setIsCreatingEntry(true),
        }}
      />
      <Stack.Screen
        name="Journal Entry"
        component={JournalEntryScreen}
        listeners={{
          focus: () => setIsCreatingEntry(true),
          blur: () => setIsCreatingEntry(false),
        }}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);

  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Journals"
        drawerContent={(props) => <NavigationDrawer {...props} />}
        screenOptions={{
          headerStyle: drawerStyles.headerStyle,
          headerTitleStyle: drawerStyles.headerTitleStyle,
          headerTintColor: drawerStyles.headerTintColor,
        }}
      >
        <Drawer.Screen
          name="Journals"
          options={{
            headerShown: !isCreatingEntry,
            headerRight: () => (
              !isCreatingEntry && (
                <TouchableOpacity style={{ marginRight: 15 }}>
                  <Ionicons name="search" size={24} color={themeStyle.beigeWhite1} />
                </TouchableOpacity>
              )
            ),
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
};

const drawerStyles = StyleSheet.create({
  headerStyle: {
    backgroundColor: themeStyle.darkBrown3,
    shadowColor: themeStyle.brightBrown,
  },
  headerTitleStyle: {
    fontFamily: 'Montserrat-Bold',
    color: themeStyle.beigeWhite1,
  },
  headerTintColor: themeStyle.beigeWhite1,
});

const stackStyles = StyleSheet.create({
  headerStyle: {
    backgroundColor: themeStyle.darkBrown3,
    shadowColor: themeStyle.brightBrown,
  },
  headerTitleStyle: {
    fontFamily: 'Montserrat-Bold',
    color: themeStyle.beigeWhite1,
  },
  headerTintColor: themeStyle.beigeWhite1,
});
