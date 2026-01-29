import React, { useState, useEffect } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import NavigationDrawer from "../components/NavigationDrawer.js";

// Assets and Styles
import { StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { themeStyle } from '../styles/theme.js';
import { navigatorStyles } from '../styles/componentStyle.js';

//Screens
import JournalScreen from '../screens/JournalScreen.js';
import CloudSyncScreen from '../screens/CloudSyncScreen.js';
import SettingsScreen from '../screens/SettingsScreen.js';
import TagsScreen from '../screens/TagsScreen.js';
import JournalEntryScreen from '../screens/JournalEntryScreen.js';
import PasswordSetupScreen from '../screens/PasswordSetupScreen.js';
import PasswordPromptScreen from '../screens/PasswordPromptScreen.js';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const JournalStack = ({ setIsCreatingEntry }) => {
  return (
    <Stack.Navigator
      initialRouteName="JournalScreen"
      headerMode="screen"
      screenOptions={{
        headerStyle: navigatorStyles.headerStyle,
        headerTitleStyle: navigatorStyles.headerTitleStyle,
        headerTintColor: navigatorStyles.headerTintColor,
      }}
    >
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

const RootStack = createStackNavigator();

export const AppNavigator = ({ initiallyPasswordVerified = false }) => {
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(initiallyPasswordVerified);

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!passwordVerified ? (
          <RootStack.Screen 
            name="PasswordPrompt" 
            options={{
              animationEnabled: false,
              cardStyle: { backgroundColor: 'transparent' },
            }}
          >
            {(props) => (
              <PasswordPromptScreen
                {...props}
                onPasswordVerified={() => setPasswordVerified(true)}
              />
            )}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen
            name="MainApp"
            options={{
              animationEnabled: false,
            }}
          >
            {() => (
              <Drawer.Navigator
                initialRouteName="Journals"
                drawerContent={(props) => <NavigationDrawer {...props} />}
                screenOptions={{
                  headerStyle: navigatorStyles.headerStyle,
                  headerTitleStyle: navigatorStyles.headerTitleStyle,
                  headerTintColor: navigatorStyles.headerTintColor,
                }}
              >
                <Drawer.Screen name="Journals" options={{headerShown: !isCreatingEntry}}>
                  {() => (
                    <JournalStack
                      setIsCreatingEntry={setIsCreatingEntry}
                      isCreatingEntry={isCreatingEntry}
                    />
                  )}
                </Drawer.Screen>
                <Drawer.Screen name="Tags" component={TagsScreen} />
                <Drawer.Screen name="Cloud Sync" component={CloudSyncScreen} />
                <Drawer.Screen name="Settings" component={SettingsScreen} />
              </Drawer.Navigator>
            )}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
