import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { themeStyle } from '../styles/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { readUniqueTags } from '../database/journalDB';

export default function SearchModal({ visible, onClose, onApplyFilters, currentFilters }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedTagNames, setSelectedTagNames] = useState([]);
  const [searchTitle, setSearchTitle] = useState('');
  const [availableTags, setAvailableTags] = useState([]);

  // Load available tags and populate with current filters when modal opens
  useEffect(() => {
    if (visible) {
      loadAvailableTags();
      // Pre-populate fields with current filters
      if (currentFilters) {
        setStartDate(currentFilters.dateRange?.startDate || null);
        setEndDate(currentFilters.dateRange?.endDate || null);
        setSelectedTagNames(currentFilters.tags || []);
        setSearchTitle(currentFilters.searchTitle || '');
      }
    }
  }, [visible, currentFilters]);

  const loadAvailableTags = async () => {
    try {
      const loadedTags = await readUniqueTags();
      setAvailableTags(loadedTags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      setAvailableTags([]);
    }
  };

  const handleApplyFilters = () => {
    // Validate date range
    if (endDate && startDate && endDate < startDate){
      Alert.alert('Invalid Date Range', 'End Date must be after Start Date');
      return;
    }

    if( !startDate && !endDate && selectedTagNames.length === 0 && !searchTitle){
      Alert.alert('No Filter', 'Please apply at least one filter');
      return;
    }

    // If only start date is given, use today as end date
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    if (startDate && !endDate) {
      finalEndDate = new Date(); // Today
    }
    
    onApplyFilters({    // Passes back to onApplyFilters back in JournalScreen.js
      dateRange: { startDate: finalStartDate, endDate: finalEndDate },
      tags: selectedTagNames,
      searchTitle,
    });
    
    // Reset every selection
    resetSelection();
  };

  const resetSelection = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedTagNames([]);
    setSearchTitle('');
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={resetSelection}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Search By?</Text>

          {/* Date Range */}
          <View style={styles.dateContainer}>
            <Text style={styles.label}>Start Date:</Text>
            <TouchableOpacity
              onPress={() => setShowStartDatePicker(true)}
              style={styles.datePickerButton}
            >
              <Ionicons name="calendar" size={20} style={styles.dateIcon} />
              <Text>{startDate ? startDate.toLocaleDateString() : 'Select Date'}</Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setStartDate(selectedDate);
                  }
                  setShowStartDatePicker(false);
                }}
              />
            )}

            <Text style={styles.label}>End Date:</Text>
            <TouchableOpacity
              onPress={() => setShowEndDatePicker(true)}
              style={styles.datePickerButton}
            >
              <Ionicons name="calendar" size={20} style={styles.dateIcon} />
              <Text>{endDate ? endDate.toLocaleDateString() : 'Select Date'}</Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                  setShowEndDatePicker(false);
                }}
              />
            )}

            <View style={styles.divider} />

          </View>

          {/* Tags Selection */}
          <Text style={styles.label}>Tags (click to select):</Text>
          
          {/* Available tags helper */}
          {availableTags.length > 0 && (
            <View style={styles.availableTagsContainer}>
              <Text style={styles.availableTagsLabel}>Available tags:</Text>
              <ScrollView 
                style={styles.availableTagsScroll}
                contentContainerStyle={styles.availableTagsDisplay}
                showsVerticalScrollIndicator={true}
              >
              {availableTags.map((tag, index) => {
                const tagName = typeof tag === 'string' ? tag : tag.name;
                const tagColor = typeof tag === 'string' ? '#8E44AD' : (tag.color || '#8E44AD');
                const isSelected = selectedTagNames.includes(tagName);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.availableTag, 
                      { 
                        backgroundColor: isSelected ? tagColor : `${tagColor}20`, 
                        borderColor: tagColor,
                        borderWidth: isSelected ? 2 : 1,
                      }
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedTagNames(selectedTagNames.filter(t => t !== tagName));
                      } else {
                        setSelectedTagNames([...selectedTagNames, tagName]);
                      }
                    }}
                  >
                    <Text style={[styles.availableTagText, { color: isSelected ? '#fff' : tagColor }]}>{tagName}</Text>
                  </TouchableOpacity>
                );
              })}
              </ScrollView>
            </View>
          )}

          {/* Selected tags display */}
          {selectedTagNames.length > 0 && (
            <View style={styles.selectedTagsContainer}>
              <Text style={styles.selectedTagsLabel}>Selected Tags:</Text>
              <ScrollView
                style={styles.selectedTagsScroll}
                contentContainerStyle={[styles.tagsDisplay, { paddingRight: 8 }]}
                showsVerticalScrollIndicator={true}
              >
                {selectedTagNames.map((tagName, index) => {
                  const tag = availableTags.find(t => (typeof t === 'string' ? t : t.name) === tagName);
                  const tagColor = typeof tag === 'string' ? '#8E44AD' : (tag?.color || '#8E44AD');
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.selectedTag, { backgroundColor: tagColor }]}
                      onPress={() => {
                        setSelectedTagNames(selectedTagNames.filter(t => t !== tagName));
                      }}
                    >
                      <Text style={styles.selectedTagText}>{tagName}</Text>
                      <Ionicons name="close" size={14} color="#fff" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Search Query */}
          <Text style={styles.label}>Search By Title:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter text to search"
            value={searchTitle}
            onChangeText={setSearchTitle}
          />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={() => {
                // Clear filters and apply
                onApplyFilters({
                  dateRange: { startDate: null, endDate: null },
                  tags: [],
                  searchTitle: '',
                });
              }}
            >
              <Ionicons name="refresh" size={18} color="#666" style={{ marginRight: 6 }} />
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={resetSelection}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={handleApplyFilters}
            >
              <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // black + translucent
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: themeStyle.white,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dateContainer: {
    width: '100%',
    marginBottom: 20,
  },
  dateIcon: {
    marginRight: 5,
    color: themeStyle.black,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  datePickerButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: themeStyle.lightGrey2,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: themeStyle.lightGrey2,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  closeButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: themeStyle.black,
    marginVertical: 5,
  },
  selectedTagsContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f0ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0d0ff',
    overflow: 'hidden',
  },
  selectedTagsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b3fa0',
    marginBottom: 8,
  },
  selectedTagsScroll: {
    maxHeight: 100,
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  selectedTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  availableTagsContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e8ff',
  },
  availableTagsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 8,
  },
  availableTagsScroll: {
    maxHeight: 120,
  },
  availableTagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  availableTag: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#99ccff',
  },
  availableTagText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '500',
  },
});

