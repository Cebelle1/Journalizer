{/* Handle JournalEntry data */}
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import JournalEntryScreen from './JournalEntryScreen'; // Import your JournalEntryScreen

const AddJournalModal = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddJournal = () => {
    setModalVisible(true); // Show the modal
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Journal Entries */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerText}>Your Journal Entries</Text>
        {/* Example Journal Entries */}
        {Array.from({ length: 10 }).map((_, index) => (
          <View key={index} style={styles.entry}>
            <Text style={styles.entryText}>Journal Entry #{index + 1}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddJournal}>
        <IonicIcon name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal for Journal Entry */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close modal on back press
      >
        <JournalEntryScreen onClose={() => setModalVisible(false)} /> {/* Pass a prop to close the modal */}
      </Modal>
    </View>
  );
};

export default AddJournalModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Add bottom padding so entries don't overlap with the FAB
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#3d3b60',
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