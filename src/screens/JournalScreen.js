import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function JournalScreen() {
    const navigation = useNavigation();

    return (
        <View style={homeStyles.container}>
            <Text style={homeStyles.text}> Journal Screen </Text>
        </View>
    );
}

const homeStyles = StyleSheet.create({
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