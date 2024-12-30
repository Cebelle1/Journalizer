import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SettingsScreen() {
    
    return (
        <View style={settingStyles.container}>
            <Text style={settingStyles.text}> Settings Screen </Text>
        </View>
    );
}

const settingStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 20,
        color: '#333',
    },
});