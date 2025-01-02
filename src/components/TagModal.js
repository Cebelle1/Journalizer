import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function TagModal({ visible, onClose, onAddTag, tags = [] }) {
  const [tagText, setTagText] = useState('');

  const handleAddTag = () => {
    if (tagText.trim()) {
      onAddTag(tagText.trim());
      setTagText('');   // Reset input
      onClose();        // Close modal
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add a Tag</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter a tag"
            value={tagText}
            onChangeText={setTagText}
          />
          {tags.length > 0 && (
            <View>
            
            {tags.map((tag, index) => (
                <TouchableOpacity key={index}>
                    <Text>{tag}</Text>
                </TouchableOpacity>
                ))}
            </View>
            )}

          <View style={styles.buttonContainer}>
            <Button title="Add" onPress={handleAddTag} />
            <Button title="Cancel" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});
