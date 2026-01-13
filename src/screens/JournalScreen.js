import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  FlatList, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Asset and Styles
import Ionicons from '@expo/vector-icons/Ionicons';
import { themeStyle, ThemeBackground } from '../styles/theme';
import { tagStylesJournalScreen, entryStyles, deleteStyle, navigatorStyles } from '../styles/componentStyle';

// Component and Util
import { formatYearMonthDay, formatYearMonthDayTime } from '../utils/dataUtils';
import TagList from '../components/TagList';
import SearchModal from '../components/SearchModal';
import SearchBar from '../components/SearchBar';

// Database
import { readAllJournalEntries, deleteJournalEntry, searchJournalEntries } from '../services/journalDB';

export default function JournalScreen({ navigation }) {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [longPressedItem, setLongPressedItem] = useState(null); // Tracks long-pressed item ID
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { startDate: null, endDate: null},
    tags: [],
    searchQuery: '',
  });

  const onSearch = useCallback(() => {
    setSearchModalVisible(true);
  }, []);

  const clearFilters = useCallback(() => {
    console.log('Clearing filters');
    setFilters({
      dateRange: { startDate: null, endDate: null },
      tags: [],
      searchTitle: '',
    });
  }, []);

  const hasActiveFilters = 
    filters.dateRange.startDate || 
    filters.dateRange.endDate || 
    filters.tags.length > 0 || 
    filters.searchTitle;
  
  console.log('Current filters state:', filters);
  console.log('hasActiveFilters:', hasActiveFilters);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "",    // Overwrite the og title
      headerShown: true,
      headerStyle: [navigatorStyles.headerStyle, {height: 30}],
      headerLeft: () => (
        <SearchBar
          onSearch={onSearch}>
        </SearchBar>
      ),
      headerRight: () => 
        hasActiveFilters ? (
          <TouchableOpacity
            onPress={clearFilters}
            style={{ marginRight: 15, padding: 8 }}
          >
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, onSearch, hasActiveFilters, clearFilters]);

  // Function to load and group entries
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await readAllJournalEntries();
      
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
  }, []);

  // Load all journal entries from the database on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Refresh entries when screen comes into focus (after deleting tags or entries)
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const onApplyFilters = (appliedFilters) => {
    console.log('Filters applied:', appliedFilters);
    setFilters(appliedFilters);
    setSearchModalVisible(false);
  };

  // When filters change, perform the search
  useEffect(() => {
    const performSearch = async () => {
      // If no filters are set, load all entries
      if (!filters.dateRange.startDate && !filters.dateRange.endDate && filters.tags.length === 0 && !filters.searchTitle) {
        const entries = await readAllJournalEntries();
        groupAndSetEntries(entries);
        return;
      }

      // Build search params
      const searchParams = {
        startDate: filters.dateRange.startDate ? filters.dateRange.startDate.toISOString() : null,
        endDate: filters.dateRange.endDate ? filters.dateRange.endDate.toISOString() : null,
        title: filters.searchTitle || null,
        tags: filters.tags || [],
      };

      try {
        setLoading(true);
        const results = await searchJournalEntries(searchParams);
        groupAndSetEntries(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [filters]);

  const groupAndSetEntries = (entries) => {
    const groupedEntries = entries.reduce((acc, entry) => {
      const year = new Date(entry.date).getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(entry);
      return acc;
    }, {});
    
    const groupedEntriesArray = Object.keys(groupedEntries).sort((a, b) => b - a).map((year) => ({
      year,
      entries: groupedEntries[year],
    }));

    setJournalEntries(groupedEntriesArray);
  };


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
        style={[styles.entry, isItemLongPressed && deleteStyle.deleteEntry]} 
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
          <Ionicons name="trash-outline" size={24} color="black" onPress={() => handleDeletePress(entry)} />
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
              <TagList
                tags={entry.tags || []}
                style={tagStylesJournalScreen} />
            </View>

            <View style={entryStyles.divider} />

            {/* Body */ }
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
    <ThemeBackground>
      <FlatList
        contentContainerStyle={styles.scrollContainer}
        data={journalEntries.flatMap((yearGroup) => [
          { year: yearGroup.year, id: yearGroup.year }, // Year Divider
          ...yearGroup.entries,                         // Insert entries under the year
        ])}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}                         // Main Entry contents
      />

      {/* Floating + Button to create Journal */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Journal Entry')}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onApplyFilters={onApplyFilters}
      />
    </ThemeBackground>

  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  yearDivider: {
    fontSize: 30,
    color: themeStyle.black,
    fontFamily: 'Montserrat-Bold',
    paddingVertical: 5,
    textAlign: 'center',
  },
  entry: {
    backgroundColor: themeStyle.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  entryTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryTextTitle: {
    fontSize: 19,
    color: themeStyle.black,
    fontFamily: 'Montserrat-Bold',
    flexShrink: 1,
  },
  entryTextDate: {
    fontSize: 16,
    color: themeStyle.black,
    fontFamily: 'Montserrat-Bold',
  },
  entryText: {
    fontSize: 14,
    color: themeStyle.black,
    fontFamily: 'Montserrat-Regular',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: themeStyle.darkPurple5,
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
