import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity,
  FlatList, StyleSheet,
  Alert, ActivityIndicator,
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Asset and Styles
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcon from '@expo/vector-icons/MaterialCommunityIcons';
import { themeStyle, ThemeBackground } from '../styles/theme';
import { createDynamicTagStylesJournalScreen, entryStyles, deleteStyle, navigatorStyles, headerSearchStyles, fabStyles, emptyStateStyles } from '../styles/componentStyle';

// Component and Util
import { formatYearMonthDay, formatYearMonthDayTime } from '../utils/dataUtils';
import { calculateFontSize } from '../utils/fontSizeUtils';
import { useFontSize } from '../context/FontSizeContext';
import TagList from '../components/TagList';
import SearchModal from '../components/SearchModal';

// Database
import { readAllJournalEntries, deleteJournalEntry, searchJournalEntries, readJournalEntriesPaginated, searchJournalEntriesPaginated } from '../database/journalDB';

export default function JournalScreen({ navigation }) {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { fontSizeMultiplier } = useFontSize();
  const [filters, setFilters] = useState({
    dateRange: { startDate: null, endDate: null},
    tags: [],
    searchTitle: '',
  });

  const PAGE_SIZE = 30;

  const onSearch = useCallback(() => {
    setSearchModalVisible(true);
  }, []);

  const totalEntriesCount = useMemo(() => 
    journalEntries.reduce((sum, group) => sum + (group.entries?.length || 0), 0),
    [journalEntries]
  );
  
  const allEntryIds = useMemo(() => 
    journalEntries.flatMap((group) => group.entries?.map((entry) => entry.id) || []),
    [journalEntries]
  );

  // Generate styles with dynamic font sizes - memoized
  const dynamicStyles = useMemo(() => createStyles(fontSizeMultiplier), [fontSizeMultiplier]);

  const dynamicTagStyles = useMemo(() => createDynamicTagStylesJournalScreen(fontSizeMultiplier), [fontSizeMultiplier]);

  // Memoize flatListData to prevent recreation on every render
  const flatListData = useMemo(() => {
  return journalEntries.flatMap((yearGroup) => [
    { type: 'year', year: yearGroup.year, id: `year-${yearGroup.year}` },
    ...yearGroup.entries.map(entry => ({
      ...entry,
      type: 'entry',
      id: entry.id, // real id only
    })),
  ]);
}, [journalEntries]);

  // Memoize renderItem function to prevent recreation on every render
  const memoizedRenderItem = useCallback(({ item }) => {
  // 🔹 Year divider
  if (item.type === 'year') {
    return (
      <Text style={dynamicStyles.yearDivider}>
        {item.year}
      </Text>
    );
  }

  // 🔹 Journal entry
  const entry = item; // already a real entry object
  const isSelected = selectedEntries.has(entry.id);

  return (
    <TouchableOpacity
      style={[
        dynamicStyles.entry,
        isSelected && { backgroundColor: themeStyle.lightPurple1 },
      ]}
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
          {/* Title + Date */}
          <View style={dynamicStyles.entryTextContainer}>
            <Text style={dynamicStyles.entryTextTitle} numberOfLines={1}>
              {entry.title}
            </Text>
            <Text style={dynamicStyles.entryTextDate}>
              {formatYearMonthDay(entry.date)}
            </Text>
          </View>

          {/* Tags */}
          <View style={dynamicStyles.entryTextContainer}>
            <TagList
              tags={entry.tags || []}
              style={dynamicTagStyles}
            />
          </View>

          <View style={entryStyles.divider} />

          {/* Body */}
          <Text style={dynamicStyles.entryText} numberOfLines={6}>
            {entry.body}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}, [
  dynamicStyles,
  dynamicTagStyles,
  selectedEntries,
  isSelectionMode,
  navigation,
]);

  const clearFilters = useCallback(() => {
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
  

  useEffect(() => {
    const screenWidth = Dimensions.get('window').width;
    const searchWidth = screenWidth - 40; // Consistent width, no adjustment needed

    // Build filter summary components
    const filterComponents = [];
    if (hasActiveFilters) {
      if (filters.tags.length > 0) {
        filterComponents.push(
          <View key="tags-label" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
            <Text style={{ color: '#999', fontSize: 12 }}>tags:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap', flexShrink: 1 }}>
              {filters.tags.slice(0, 3).map((tag, idx) => (
                <View 
                  key={`tag-${tag}-${idx}`}
                  style={{ 
                    backgroundColor: '#8E44AD20',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                    borderWidth: 0.5,
                    borderColor: '#8E44AD'
                  }}
                >
                  <Text style={{ color: '#8E44AD', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{tag}</Text>
                </View>
              ))}
              {filters.tags.length > 3 && (
                <Text style={{ color: '#8E44AD', fontSize: 11, fontWeight: '600' }}>+{filters.tags.length - 3}</Text>
              )}
            </View>
          </View>
        );
      }
      if (filters.searchTitle) {
        filterComponents.push(
          <View key="title" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
            <Text style={{ color: '#999', fontSize: 12 }}>title:</Text>
            <Text style={{ color: '#333', fontSize: 12, fontWeight: '600', flexShrink: 1 }} numberOfLines={1}>&quot;{filters.searchTitle}&quot;</Text>
          </View>
        );
      }
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        filterComponents.push(
          <Text key="date" style={{ flexShrink: 1 }}>
            <Text style={{ color: '#999', fontSize: 12 }}>date: </Text>
            <Text style={{ color: '#333', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
              {filters.dateRange.startDate.toLocaleDateString()} - {filters.dateRange.endDate.toLocaleDateString()}
            </Text>
          </Text>
        );
      } else if (filters.dateRange.startDate) {
        filterComponents.push(
          <Text key="date" style={{ flexShrink: 1 }}>
            <Text style={{ color: '#999', fontSize: 12 }}>from: </Text>
            <Text style={{ color: '#333', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{filters.dateRange.startDate.toLocaleDateString()}</Text>
          </Text>
        );
      } else if (filters.dateRange.endDate) {
        filterComponents.push(
          <Text key="date" style={{ flexShrink: 1 }}>
            <Text style={{ color: '#999', fontSize: 12 }}>until: </Text>
            <Text style={{ color: '#333', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{filters.dateRange.endDate.toLocaleDateString()}</Text>
          </Text>
        );
      }
    }

    if (isSelectionMode) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={toggleSelectAll}
                disabled={totalEntriesCount === 0}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  backgroundColor: themeStyle.lightPurple1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: totalEntriesCount === 0 ? 0.5 : 1,
                }}
              >
                <MaterialIcon
                  name={selectedEntries.size === totalEntriesCount && totalEntriesCount > 0 ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={themeStyle.darkPurple2}
                />
              </TouchableOpacity>
              <View style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: themeStyle.lightPurple1,
                minWidth: 72,
                alignItems: 'center',
              }}>
                <Text style={{ color: themeStyle.darkPurple2, fontFamily: 'Montserrat-SemiBold', fontSize: 15 }}>
                  {selectedEntries.size}/{totalEntriesCount || 0}
                </Text>
              </View>
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
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              style={{ flex: 1 }}
            >
              {filterComponents.map((component, index) => (
                <React.Fragment key={`filterComponent-${index}`}>
                  {component}
                  {index < filterComponents.length - 1 && <Text style={{ color: '#999', fontSize: 12 }} key={`dot-${index}`}>•</Text>}
                </React.Fragment>
              ))}
            </ScrollView>
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
  }, [navigation, hasActiveFilters, clearFilters, searchInput, filters, isSelectionMode, selectedEntries, totalEntriesCount, isDeleting, allEntryIds]);

  // Function to load and group entries with pagination
  const loadEntries = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setCurrentPage(0);
      setHasMore(true);
    }
    
    try {
      const page = reset ? 0 : currentPage;
      const entries = await readJournalEntriesPaginated(PAGE_SIZE, page * PAGE_SIZE);
      
      // Check if there are more entries to load
      setHasMore(entries.length === PAGE_SIZE);
      
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

      if (reset) {
        setJournalEntries(groupedEntriesArray);
      } else {
        // Merge with existing entries for pagination, avoiding duplicates
        setJournalEntries(prev => {
          const merged = [...prev];
          groupedEntriesArray.forEach(newYearGroup => {
            const existingIndex = merged.findIndex(g => g.year === newYearGroup.year);
            if (existingIndex >= 0) {
              // Filter out entries with duplicate IDs
              const existingIds = new Set(merged[existingIndex].entries.map(e => e.id));
              const uniqueNewEntries = newYearGroup.entries.filter(e => !existingIds.has(e.id));
              merged[existingIndex].entries = [...merged[existingIndex].entries, ...uniqueNewEntries];
            } else {
              merged.push(newYearGroup);
            }
          });
          return merged.sort((a, b) => b.year - a.year);
        });
      }
      
      if (!reset) {
        setCurrentPage(page + 1);
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      if (reset) {
        setLoading(false);
      }
    }
  }, [currentPage]);

  // Load more entries when scrolling
  const loadMoreEntries = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    
    setLoadingMore(true);
    try {
      await loadEntries(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadEntries, loadingMore, hasMore, loading]);

  // Load all journal entries from the database on mount
  useEffect(() => {
    loadEntries(true);
  }, []);

  // Refresh entries when screen comes into focus (after deleting tags or entries)
  useFocusEffect(
    useCallback(() => {
      // Close search modal when coming back from another screen
      setSearchModalVisible(false);
      loadEntries(true);
    }, [])
  );

  const onApplyFilters = (appliedFilters) => {
    setFilters(appliedFilters);
    setSearchModalVisible(false);
  };

  // When filters change, perform the search
  useEffect(() => {
    const performSearch = async () => {
      // If no filters are set, load all entries with pagination
      if (!filters.dateRange.startDate && !filters.dateRange.endDate && filters.tags.length === 0 && !filters.searchTitle) {
        loadEntries(true);
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
        setCurrentPage(0);
        setHasMore(false); // Disable pagination for search results
        const results = await searchJournalEntriesPaginated({ ...searchParams, limit: 1000, offset: 0 });
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

  const toggleSelectAll = () => {
    if (selectedEntries.size === totalEntriesCount && totalEntriesCount > 0) {
      setSelectedEntries(new Set());
      return;
    }
    setSelectedEntries(new Set(allEntryIds));
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
              loadEntries(true);
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


  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

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
          contentContainerStyle={dynamicStyles.scrollContainer}
          data={flatListData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={memoizedRenderItem}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          onEndReached={loadMoreEntries}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={themeStyle.darkPurple2} />
              </View>
            ) : null
          }
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
        currentFilters={filters}
      />
    </ThemeBackground>

  );
}

const createStyles = (fontSizeMultiplier) => StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  yearDivider: {
    fontSize: calculateFontSize(30, fontSizeMultiplier),
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
    fontSize: calculateFontSize(19, fontSizeMultiplier),
    color: themeStyle.black,
    fontFamily: 'Montserrat-Bold',
    flexShrink: 1,
  },
  entryTextDate: {
    fontSize: calculateFontSize(16, fontSizeMultiplier),
    color: themeStyle.black,
    fontFamily: 'Montserrat-Bold',
  },
  entryText: {
    fontSize: calculateFontSize(14, fontSizeMultiplier),
    color: themeStyle.black,
    fontFamily: 'Montserrat-Regular',
  },
});

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
