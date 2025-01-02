import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ImageBackground,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BackgroundImage from '../assets/image/journalizer-background-2.png';
import { formatYearMonthDay } from '../utils/dataUtils';
import { themeStyle } from '../styles/theme';

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
        const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        setJournalEntries(sortedEntries);
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
    setJournalEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id));
  };

  const handleDeletePress = (id) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            deleteSelectedJournalEntry(id);
            setLongPressedItem(null); // Reset long press state
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => {
    const isItemLongPressed = longPressedItem === item.id;
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.entry,
          isItemLongPressed && styles.longPressedEntry, // Change style on long press
        ]}
        onLongPress={() => setLongPressedItem(item.id)} // Set the long-pressed item
        onPress={() => {
          if (longPressedItem && longPressedItem === item.id) {
            // Allow delete when pressed on the red area
            handleDeletePress(item.id);
          } else if (longPressedItem && longPressedItem !== item.id) {
            // Reset long press state when another item is pressed
            setLongPressedItem(null);

          } else {
            navigation.navigate('Journal Entry', { id: item.id });
          }
        }}
      >
        {isItemLongPressed ? (
          <Ionicons
            name="trash-outline"
            size={24}
            color="white"
            onPress={() => handleDeletePress(item.id)}
          />
        ) : (
          <View>
            <View style={styles.entryTextContainer}>
              <Text style={styles.entryTextTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.entryTextDate}>{formatYearMonthDay(item.date)}</Text>
            </View>
            <Text style={styles.entryText} numberOfLines={6}>
              {item.body}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Return must be after the useEffect functions
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ImageBackground source={BackgroundImage} style={styles.backgroundImage}>
      <Text style={styles.headerText}>Your Journal Entries</Text>
      <FlatList
        contentContainerStyle={styles.scrollContainer}
        data={journalEntries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Journal Entry')}
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
    paddingBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    marginVertical: 20,
    color: themeStyle.darkPurple4,
    textAlign: 'center',
  },
  entry: {
    backgroundColor: themeStyle.lightPurpleTint,
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
    fontSize: 20,
    color: themeStyle.darkPurple1,
    fontFamily: 'GenBasB',
    flexShrink: 1,
  },
  entryTextDate: {
    fontSize: 18,
    color: themeStyle.darkGrey2,
    fontFamily: 'GenBasB',
  },
  entryText: {
    fontSize: 16,
    color: themeStyle.darkGrey1,
    fontFamily: 'GenBasR',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: themeStyle.darkPurple2,
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
