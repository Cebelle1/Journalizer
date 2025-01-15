import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { themeStyle } from '../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function SearchModal({ visible, onClose, onApplyFilters }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tags, setTags] = useState('');
  const [searchTitle, setSearchTitle] = useState('');

  const handleApplyFilters = () => {
    // Checks
    if ( (startDate && !endDate || !startDate && endDate)){   // logical xor
      alert('To search by date range, both start and end dates must be selected.')
      // No return to close modal to reset date incase its unwanted.
    }
    if (endDate && startDate && endDate < startDate){
      alert('End Date must be after Start Date');
      return; // Return to not close modal, for easier reselect date.
    }

    if( !startDate && !endDate && !tags && !searchTitle){
      alert('No filter applied');
    } else {
      onApplyFilters({    // Passes back to onApplyFilters back in JournalScreen.js
        dateRange: { startDate, endDate },
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        searchTitle,
      });
    }
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
          />

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
            <Button title="Close" onPress={resetSelection} color="red" />
            <Button title="Apply" onPress={handleApplyFilters} />
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
  },
  divider: {
    height: 1,
    backgroundColor: themeStyle.black,
    marginVertical: 5,
  },
});

