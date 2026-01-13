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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { themeStyle } from '../styles/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { readUniqueTags } from '../services/journalDB';

export default function SearchModal({ visible, onClose, onApplyFilters }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tags, setTags] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [availableTags, setAvailableTags] = useState([]);

  // Load available tags when modal opens
  useEffect(() => {
    if (visible) {
      loadAvailableTags();
    }
  }, [visible]);

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

    if( !startDate && !endDate && !tags && !searchTitle){
      Alert.alert('No Filter', 'Please apply at least one filter');
      return;
    }

    // Validate tags - check if entered tags exist
    const enteredTags = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (enteredTags.length > 0) {
      const invalidTags = enteredTags.filter(tag => !availableTags.includes(tag));
      if (invalidTags.length > 0) {
        Alert.alert(
          'Invalid Tags',
          `The following tags don't exist:\n\n${invalidTags.join(', ')}\n\nAvailable tags:\n${availableTags.join(', ')}`
        );
        return;
      }
    }

    // If only start date is given, use today as end date
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    if (startDate && !endDate) {
      finalEndDate = new Date(); // Today
    }
    
    onApplyFilters({    // Passes back to onApplyFilters back in JournalScreen.js
      dateRange: { startDate: finalStartDate, endDate: finalEndDate },
      tags: enteredTags,
      searchTitle,
    });
    
    // Reset every selection
    resetSelection();
  };

  const resetSelection = () => {
    setStartDate(null);
    setEndDate(null);
    setTags('');
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
                display="default"
                onChange={(event, date) => {
                  setShowStartDatePicker(false);
                  if (date) setStartDate(date);
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
                display="default"
                onChange={(event, date) => {
                  setShowEndDatePicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}

            <View style={styles.divider} />

          </View>

          {/* Tags */}
          <Text style={styles.label}>Tags (comma-separated):</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., work, personal"
            value={tags}
            onChangeText={setTags}
            placeholderTextColor="#999"
          />
          
          {/* Available tags helper */}
          {availableTags.length > 0 && (
            <View style={styles.availableTagsContainer}>
              <Text style={styles.availableTagsLabel}>Available tags:</Text>
              <View style={styles.availableTagsDisplay}>
                {availableTags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.availableTag}
                    onPress={() => {
                      // Add clicked tag to input
                      const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                      if (!currentTags.includes(tag)) {
                        setTags(currentTags.length > 0 ? `${tags}, ${tag}` : tag);
                      }
                    }}
                  >
                    <Text style={styles.availableTagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {tags.length > 0 && (
            <View style={styles.selectedTagsContainer}>
              <Text style={styles.selectedTagsLabel}>Selected Tags:</Text>
              <View style={styles.tagsDisplay}>
                {tags.split(',').map((tag, index) => {
                  const trimmedTag = tag.trim();
                  return trimmedTag ? (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{trimmedTag}</Text>
                    </View>
                  ) : null;
                })}
              </View>
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
                resetSelection();
                onClose();
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
  },
  selectedTagsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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

