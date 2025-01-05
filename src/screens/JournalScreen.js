import React, { useState, useEffect, useCallback } from 'react';
import {
  View,Text,TouchableOpacity,
  FlatList, StyleSheet, ImageBackground,
  Alert,ActivityIndicator,
} from 'react-native';

// Asset and Styles
import Ionicons from 'react-native-vector-icons/Ionicons';
import { themeStyle } from '../styles/theme';
import { tagStylesJournalScreen } from '../styles/componentStyle';
import NotebookBG from '../assets/image/notebook-background-6.png'

// Component and Util
import { formatYearMonthDay, formatYearMonthDayTime } from '../utils/dataUtils';
import Tags from '../components/Tags';

// Database
import { readAllJournalEntries, deleteJournalEntry } from '../services/journalDB';

export default function JournalScreen({ navigation }) {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [longPressedItem, setLongPressedItem] = useState(null); // Tracks long-pressed item ID

  // Load all journal entries from the database
  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      try {
        const entries = await readAllJournalEntries();
        //const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Group entries by year
        const groupedEntries = entries.reduce((acc, entry) => {
          const year = new Date(entry.date).getFullYear();
          if (!acc[year]) {
            acc[year] = [];
          }
          acc[year].push(entry);
          return acc;
        }, {});
        
        // Convert grouped entries into an array format for FlatList
        const groupedEntriesArray = Object.keys(groupedEntries).sort((a, b) => b - a).map((year) => ({
          year,
          entries: groupedEntries[year],
        }));

        setJournalEntries(groupedEntriesArray);
      } catch (error) {
        console.error('Failed to load journal entries:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);

  const onSearch = useCallback(() => {
    console.log('Search button pressed');
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={onSearch} style={{ marginRight: 15 }}>
          <Ionicons name="search-outline" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, onSearch]);

  const deleteSelectedJournalEntry = async (id) => {
    await deleteJournalEntry(id);
    // Manually update the state to remove the deleted entry instead of fetching the API again
    setJournalEntries((prevEntries) => {
      return prevEntries.map((yearGroup) => ({
        ...yearGroup,
        entries: yearGroup.entries.filter((entry) => entry.id !== id),
      }));
    });
  };

  const handleDeletePress = (entry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? \n Title: ' + entry.title + '\n Date: ' + formatYearMonthDayTime(entry.date),
      [
        { text: 'Cancel', style: 'cancel', onPress: () => { setLongPressedItem(null); } },
        {
          text: 'Delete',
          onPress: () => {
            deleteSelectedJournalEntry(entry.id);
            setLongPressedItem(null); // Reset long press state
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => {
    if (item.year) {
      {/* Year Divider */}
      return (
        <Text style={styles.yearDivider}>{item.year}</Text>
      );
    }

    const entry = item; // Individual journal entry
    const isItemLongPressed = longPressedItem === entry.id;

    {/* Delete Journal Entry long press logic*/}
    return (
      <TouchableOpacity
        key={entry.id}
        style={[styles.entry, isItemLongPressed && styles.longPressedEntry]} 
        onLongPress={() => setLongPressedItem(entry.id)} // Set long-pressed item
        onPress={() => {
          if (longPressedItem && longPressedItem === entry.id) {
            handleDeletePress(entry); // Delete on long press
          } else if (longPressedItem && longPressedItem !== entry.id) {
            setLongPressedItem(null); // Reset long press state
          } else {
            navigation.navigate('Journal Entry', { id: entry.id });
          }
        }}
      >
        {isItemLongPressed ? (
          <Ionicons name="trash-outline" size={24} color="white" onPress={() => handleDeletePress(entry)} />
        ) : (
          <View>
            {/* Title and Date */}
            <View style={styles.entryTextContainer}>
              <Text style={styles.entryTextTitle} numberOfLines={1}>
                {entry.title}
              </Text>
              <Text style={styles.entryTextDate}>{formatYearMonthDay(entry.date)}</Text>
            </View>

            {/* Tags */}
            <View style={styles.entryTextContainer}>
              <Tags 
                tags={JSON.parse(entry.tags)}
                style={tagStylesJournalScreen} />
            </View>
            
            <Text style={styles.entryText} numberOfLines={6}>
              {entry.body}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ImageBackground style={styles.backgroundImage}>
      <FlatList
        contentContainerStyle={styles.scrollContainer}
        data={journalEntries.flatMap((yearGroup) => [
          { year: yearGroup.year, id: yearGroup.year }, // Year Divider
          ...yearGroup.entries,                         // Insert entries under the year
        ])}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />

      {/* Floating + Button to create Journal */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Journal Entry')}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'contain',
    backgroundColor:  themeStyle.lightBrown
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  yearDivider: {
    fontSize: 30,
    color: themeStyle.beigeWhite1,
    fontFamily: 'Montserrat-Bold',
    paddingVertical: 5,
    textAlign: 'center',
  },
  entry: {
    backgroundColor: themeStyle.beigeWhite1,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  longPressedEntry: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryTextTitle: {
    fontSize: 21,
    color: themeStyle.darkBrown,
    fontFamily: 'GenBasB',
    flexShrink: 1,
  },
  entryTextDate: {
    fontSize: 18,
    color: themeStyle.black,
    fontFamily: 'GenBasB',
  },
  entryText: {
    fontSize: 16,
    color: themeStyle.black,
    fontFamily: 'GenBasR',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: themeStyle.darkBrown,
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
