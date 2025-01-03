import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import { useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { themeStyle } from '../styles/theme.js';
import { tagStyles } from '../styles/componentStyle.js';

export default function TagModal({ visible, onClose, onAddTag, onDeleteTag, tags = [] }) {
  const [tagText, setTagText] = useState('');
  const [tagPressed, setTagPressed] = useState(null);

  const handleAddTag = () => {
    if (tagText.trim()) {
      onAddTag(tagText.trim()); // Passes tagText back to addTag(tag) in JournalEntryScreen.js
      setTagText('');   // Reset input
      onClose();        // Close modal
    }
  };

  const handleDeleteTag = (delTag) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete the tag "${delTag}"?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setTagPressed('') },
        { 
          text: 'Delete', 
          onPress: () => { 
            onDeleteTag(delTag); // Passes tag to deleteTag(tag) in JournalEntryScreen.js
        }},
      ],
      { cancelable: true }
    );
    
  }

  // Reset tagPressed whenever modal is closed (and open)
  useEffect(() => {
    setTagPressed(null);
  }
  , [visible]);

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

          {/* Display existing tags */}
          {tags.length > 0 && (
            <View style={tagStyles.tagsContainer}>
            {tags.map((tag, index) => (
                
              <TouchableOpacity key={index} style={[tagStyles.tagBorder, tagPressed === tag && styles.pressedEntry]} onPress={() => {
                // If tag was already pressed once  
                if(tagPressed === tag) {
                    handleDeleteTag(tag);     // Delete tag
                    setTagPressed('');        // Reset tagPressed
                } else {
                  // Set tagPressed on first press
                  setTagPressed(tag);
                }
              }}>
                {
                  tagPressed === tag ? 
                  <View style={tagStyles.tagsContainer}>
                    <Ionicons 
                      name="trash-outline" 
                      size={16} 
                      color="white" 
                      style={[tagStyles.tagIcon]} 
                    />
                    <Text style={[tagStyles.tagText, styles.modalTagText]}>{tag}</Text>
                  </View>
                  : 
                  <Text styles={tagStyles.tagText}>{tag}</Text>
                }
              </TouchableOpacity>
              ))}
          </View>
          )}

          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Add" onPress={handleAddTag} />
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
    fontFamily: 'Montserrat-Bold',
    marginBottom: 10,
  },
  modalTagText: {
    fontSize: 16,
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
  pressedEntry: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
