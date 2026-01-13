import React, { useState, useEffect } from 'react';
import { readUniqueTags } from '../services/journalDB';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tagStyles, deleteStyle } from '../styles/componentStyle.js';
import { ThemeBackground } from '../styles/theme.js';

export default function TagModal({ visible, onClose, onAddTag, onRemoveTag, currentTags = [], allTags = [] }) {
  const [searchText, setSearchText] = useState('');
  const [filteredAvailableTags, setFilteredAvailableTags] = useState([]);

  // Filter available tags (exclude already added ones)
  useEffect(() => {
    if (searchText.trim()) {
      const availableTags = allTags.filter(tag => !currentTags.includes(tag));
      setFilteredAvailableTags(availableTags.filter(tag => 
        tag.toLowerCase().includes(searchText.toLowerCase())
      ));
    } else {
      const availableTags = allTags.filter(tag => !currentTags.includes(tag));
      setFilteredAvailableTags(availableTags);
    }
  }, [searchText, allTags, currentTags]);

  // Reset search when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSearchText('');
    }
  }, [visible]);

  const handleSelectTag = (tag) => {
    onAddTag(tag);
    setSearchText('');
  };

  const handleRemoveTag = (tag) => {
    onRemoveTag(tag);
  };

  const handleCreateNewTag = () => {
    if (searchText.trim()) {
      // Check if tag already exists globally
      const exists = allTags.some(tag => tag.toLowerCase() === searchText.trim().toLowerCase());
      if (exists) {
        // Tag exists but not in current entry, just add it
        handleSelectTag(searchText.trim());
        return;
      }
      // Create new tag and add to current entry
      onAddTag(searchText.trim());
      setSearchText('');
    }
  };

  const showCreateButton = searchText.trim() && 
    !allTags.some(tag => tag.toLowerCase() === searchText.trim().toLowerCase());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Manage Tags</Text>
          
          {/* Current entry tags section */}
          {currentTags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags in this entry</Text>
              <View style={styles.currentTagsContainer}>
                {currentTags.map((tag, index) => (
                  <View key={index} style={styles.currentTagItem}>
                    <Text style={styles.currentTagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <Ionicons name="close" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Search input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add more tags</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search or create new tag..."
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Available tags list */}
          <ScrollView style={styles.tagsScrollView} showsVerticalScrollIndicator={false}>
            {filteredAvailableTags.length > 0 ? (
              <View style={styles.tagsContainer}>
                {filteredAvailableTags.map((tag, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.tagRow}
                    onPress={() => handleSelectTag(tag)}
                  >
                    <Ionicons name="add" size={18} color="#007AFF" />
                    <Text style={styles.tagButtonText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noTagsText}>
                {searchText ? 'No matching tags found' : 'All tags already added'}
              </Text>
            )}
          </ScrollView>

          {/* Create new tag button */}
          {showCreateButton && (
            <TouchableOpacity style={styles.createButton} onPress={handleCreateNewTag}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create "{searchText}"</Text>
            </TouchableOpacity>
          )}

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
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
    width: '85%',
    maxHeight: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#000',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
    marginBottom: 8,
  },
  currentTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currentTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  currentTagText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'Montserrat-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Montserrat-Regular',
  },
  tagsScrollView: {
    maxHeight: 200,
    width: '100%',
  },
  tagsContainer: {
    width: '100%',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagButtonText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Montserrat-Regular',
  },
  noTagsText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    paddingVertical: 30,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 15,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
});
