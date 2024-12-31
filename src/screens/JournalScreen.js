import React, { useState, useEffect } from 'react';
import { View, Text, ImageBackground, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BackgroundImage from '../assets/image/journalizer-background-2.png';
import { formatYearMonthDay, formatYear } from '../utils/dataUtils';

// Database
import { readJournalEntry, readAllJournalEntries, deleteJournalEntry } from '../services/journalDB';

export default function JournalScreen({ navigation }) {
  const [journalEntries, setJournalEntries] = useState([]);

  // Load all journal entries from the database
  useEffect(() => {
    const loadEntries = async () => {
      const entries = await readAllJournalEntries();
      setJournalEntries(entries);
    };
    loadEntries();
  }, []);

  // Delete a journal entry using id
  const deleteJournalEntry = async (id) => {
    await deleteJournalEntry(id);
    const updatedEntries = await readAllJournalEntries();
    setJournalEntries(updatedEntries);
  };

  // Sort the journal entires according to date
  const sortedJournalEntries = [...journalEntries].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <ImageBackground source={BackgroundImage} style={styles.backgroundImage}>
      <Text style={styles.headerText}>Your Journal Entries</Text>
      {/* FlatList with ListHeaderComponent */}
      <FlatList
        contentContainerStyle={styles.scrollContainer}
        data={sortedJournalEntries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            key={item.id}
            style={styles.entry} 
            onPress={() => navigation.navigate('JournalEntry', { id: item.id })}  // Pass id to update entry
            >
            <Text style={styles.entryTextTitle}>{item.title}</Text>
            <Text style={styles.entryText}>{item.body}</Text>
            <Text style={styles.entryText}>{formatYearMonthDay(item.date)}</Text> 
          </TouchableOpacity>
        )}
        
      />

      {/* Floating Add Journal Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          navigation.navigate('JournalEntry'); // Stack nav to JournalEntryScreen
        }}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20, // Add bottom padding so entries don't overlap with the FAB
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    marginVertical: 20,
    color: '#3d3b60',
    textAlign: 'center',
  },
  entry: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  entryTextTitle: {
    fontSize: 20,
    color: '#3d3b60',
    fontFamily: 'Montserrat-Bold',
  },
  entryText: {
    fontSize: 16,
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#c599c7', // Light purple color
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});
