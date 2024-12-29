import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function CloudSyncScreen() {
    const navigation = useNavigation();
    
    return (
        <View style={cloudSyncStyles.container}>
            <Text style={cloudSyncStyles.text}> Cloud Sync Screen </Text>
        </View>
    );
}

const cloudSyncStyles = StyleSheet.create({
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
