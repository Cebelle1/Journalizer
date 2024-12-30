import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CreateJournalEntry() {
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Journal Entry</Text>
      </View>
    );
}

const styles = StyleSheet.create({
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