import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  FlatList, StyleSheet,
  Alert, ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Asset and Styles
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcon from '@expo/vector-icons/MaterialCommunityIcons';
import { themeStyle, ThemeBackground } from '../styles/theme';
import { tagStylesJournalScreen, entryStyles, deleteStyle, navigatorStyles, headerSearchStyles, fabStyles, emptyStateStyles } from '../styles/componentStyle';

// Component and Util
import { formatYearMonthDay, formatYearMonthDayTime } from '../utils/dataUtils';
import TagList from '../components/TagList';
import SearchModal from '../components/SearchModal';

// Database
import { readAllJournalEntries, deleteJournalEntry, searchJournalEntries, exportSingleEntry } from '../database/journalDB';
import googleDriveService from '../services/googleDriveService';

export default function JournalScreen({ navigation }) {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { startDate: null, endDate: null},
    tags: [],
    searchQuery: '',
  });

  const onSearch = useCallback(() => {
    setSearchModalVisible(true);
  }, []);

  const totalEntriesCount = journalEntries.reduce((sum, group) => sum + (group.entries?.length || 0), 0);

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
    const screenWidth = Dimensions.get('window').width;
    const searchWidth = screenWidth - 40; // Consistent width, no adjustment needed

    // Build filter summary components
    const filterComponents = [];
    if (hasActiveFilters) {
      if (filters.tags.length > 0) {
        filterComponents.push(
          <Text key="tags">
            <Text style={{ color: '#999', fontSize: 13 }}>tags: </Text>
            <Text style={{ color: '#333', fontSize: 13, fontWeight: '600' }}>{filters.tags.join(', ')}</Text>
          </Text>
        );
      }
      if (filters.searchTitle) {
        filterComponents.push(
          <Text key="title">
            <Text style={{ color: '#999', fontSize: 13 }}>title: </Text>
            <Text style={{ color: '#333', fontSize: 13, fontWeight: '600' }}>&quot;{filters.searchTitle}&quot;</Text>
          </Text>
        );
      }
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        filterComponents.push(
          <Text key="date">
            <Text style={{ color: '#999', fontSize: 13 }}>date: </Text>
            <Text style={{ color: '#333', fontSize: 13, fontWeight: '600' }}>
              {filters.dateRange.startDate.toLocaleDateString()} - {filters.dateRange.endDate.toLocaleDateString()}
            </Text>
          </Text>
        );
      } else if (filters.dateRange.startDate) {
        filterComponents.push(
          <Text key="date">
            <Text style={{ color: '#999', fontSize: 13 }}>from: </Text>
            <Text style={{ color: '#333', fontSize: 13, fontWeight: '600' }}>{filters.dateRange.startDate.toLocaleDateString()}</Text>
          </Text>
        );
      } else if (filters.dateRange.endDate) {
        filterComponents.push(
          <Text key="date">
            <Text style={{ color: '#999', fontSize: 13 }}>until: </Text>
            <Text style={{ color: '#333', fontSize: 13, fontWeight: '600' }}>{filters.dateRange.endDate.toLocaleDateString()}</Text>
          </Text>
        );
      }
    }

    if (isSelectionMode) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: themeStyle.lightPurple1,
              minWidth: 72,
              alignItems: 'center',
            }}>
              <Text style={{ color: themeStyle.darkPurple2, fontFamily: 'Montserrat-SemiBold', fontSize: 15 }}>
                {selectedEntries.size}/{totalEntriesCount || 0}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={handleDeleteSelected}
                disabled={isDeleting || selectedEntries.size === 0}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#ff6b6b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isDeleting || selectedEntries.size === 0 ? 0.5 : 1,
                }}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={themeStyle.white} />
                ) : (
                  <Ionicons name="trash-outline" size={18} color={themeStyle.white} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBackupSelected}
                disabled={isBackingUp || selectedEntries.size === 0}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: themeStyle.darkPurple2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isBackingUp || selectedEntries.size === 0 ? 0.5 : 1,
                }}
              >
                {isBackingUp ? (
                  <ActivityIndicator size="small" color={themeStyle.white} />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={18} color={themeStyle.white} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedEntries(new Set());
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: themeStyle.lightGrey2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={18} color={themeStyle.black} />
              </TouchableOpacity>
            </View>
          </View>
        ),
        headerShown: true,
        headerStyle: [navigatorStyles.headerStyle, {height: 45}],
        headerLeft: null,
        headerRight: null,
      });
      return;
    }

    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity 
          style={[headerSearchStyles.searchContainer, { width: searchWidth }]}
          onPress={() => setSearchModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={20} style={headerSearchStyles.searchIcon} />
          {hasActiveFilters ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {filterComponents.map((component, index) => (
                <React.Fragment key={index}>
                  {component}
                  {index < filterComponents.length - 1 && <Text style={{ color: '#999', fontSize: 13 }}> • </Text>}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <Text style={[headerSearchStyles.searchInput, { color: '#999' }]} numberOfLines={1}>
              Search entries...
            </Text>
          )}
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              style={{ marginLeft: 8}}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={25} color="#f7524aff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ),
      headerShown: true,
      headerStyle: [navigatorStyles.headerStyle, {height: 45}],
      headerLeft: null,
      headerRight: null,
    });
  }, [navigation, hasActiveFilters, clearFilters, searchInput, filters, isSelectionMode, selectedEntries, totalEntriesCount, isDeleting, isBackingUp]);

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
      // Close search modal when coming back from another screen
      setSearchModalVisible(false);
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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            deleteSelectedJournalEntry(entry.id);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const toggleSelection = (entryId) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedEntries.size === 0) {
      Alert.alert('No Selection', 'Please select at least one entry to delete');
      return;
    }

    Alert.alert(
      'Delete Selected Entries',
      `Delete ${selectedEntries.size} selected entries? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Delete each selected entry
              for (const entryId of selectedEntries) {
                try {
                  await deleteJournalEntry(entryId);
                } catch (error) {
                  console.error(`Failed to delete entry ${entryId}:`, error);
                }
              }

              Alert.alert('Success', `Deleted ${selectedEntries.size} entries`);
              
              // Clear selection and exit selection mode
              setSelectedEntries(new Set());
              setIsSelectionMode(false);
              
              // Reload entries
              loadEntries();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete entries: ' + error.message);
            } finally {
              setIsDeleting(false);
            }
          },
          style: 'destructive',
        }
      ]
    );
  };

  const handleBackupSelected = async () => {
    if (selectedEntries.size === 0) {
      Alert.alert('No Selection', 'Please select at least one entry to backup');
      return;
    }

    Alert.alert(
      'Backup Selected Entries',
      `Backup ${selectedEntries.size} selected entries to Google Drive?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Backup',
          onPress: async () => {
            setIsBackingUp(true);
            try {
              const isAuthenticated = await googleDriveService.isAuthenticated();
              if (!isAuthenticated) {
                Alert.alert('Not Authenticated', 'Please sign in to Google Drive first');
                setIsBackingUp(false);
                return;
              }

              // Export each selected entry and get backup data
              const backupDataList = [];
              for (const entryId of selectedEntries) {
                try {
                  const backupData = await exportSingleEntry(entryId);
                  backupDataList.push(backupData);
                } catch (error) {
                  console.error(`Failed to export entry ${entryId}:`, error);
                }
              }

              if (backupDataList.length === 0) {
                Alert.alert('Error', 'Failed to prepare entries for backup');
                return;
              }

              const fileIds = await googleDriveService.backupSelectedEntries(backupDataList);
              Alert.alert('Success', `Backed up ${fileIds.length} entries to Google Drive`);
              
              // Clear selection and exit selection mode
              setSelectedEntries(new Set());
              setIsSelectionMode(false);
            } catch (error) {
              console.error('Backup error:', error);
              Alert.alert('Error', 'Failed to backup entries: ' + error.message);
            } finally {
              setIsBackingUp(false);
            }
          }
        }
      ]
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
    const isSelected = selectedEntries.has(entry.id);

    {/* Delete Journal Entry long press logic or Selection mode*/}
    return (
      <TouchableOpacity
        key={entry.id}
        style={[styles.entry, isSelected && { backgroundColor: themeStyle.lightPurple1 }]} 
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            toggleSelection(entry.id);
          }
        }}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(entry.id);
          } else {
            navigation.navigate('Journal Entry', { id: entry.id });
          }
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {isSelectionMode && (
            <MaterialIcon
              name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={themeStyle.darkPurple2}
              style={{ marginRight: 10, marginTop: 5 }}
            />
          )}
          <View style={{ flex: 1 }}>
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
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const flatListData = journalEntries.flatMap((yearGroup) => [
    { year: yearGroup.year, id: yearGroup.year }, // Year Divider
    ...yearGroup.entries,                         // Insert entries under the year
  ]);

  return (
    <ThemeBackground>
      {/* Header with Select/Backup buttons when in selection mode */}
      {/* Selection header now lives in navigation bar; no extra in-content bar */}

      {flatListData.length === 0 ? (
        <View style={emptyStateStyles.emptyContainer}>
          <Ionicons name="document-text" size={64} color="#ccc" />
          <Text style={emptyStateStyles.emptyText}>No journals yet</Text>
          <Text style={emptyStateStyles.emptySubtext}>
            Tap the + button below to create your first journal entry
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.scrollContainer}
          data={flatListData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}                         // Main Entry contents
        />
      )}

      {/* Floating + Button to create Journal */}
      <TouchableOpacity style={fabStyles.fab} onPress={() => navigation.navigate('Journal Entry')}>
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
});
