import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { readUniqueTags, deleteTagFromAllEntries, createTag } from '../services/journalDB';
import Ionicons from '@expo/vector-icons/Ionicons';
import { themeStyle, ThemeBackground } from '../styles/theme';
import { searchStyles } from '../styles/componentStyle';

export default function TagsScreen() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [adding, setAdding] = useState(false);

  // Load all tags on component mount
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const uniqueTags = await readUniqueTags();
      console.log('Loaded tags from readUniqueTags:', uniqueTags);
      setTags(uniqueTags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      Alert.alert('Error', 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = (tagName) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete the tag "${tagName}"? This will remove it from all entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await performDelete(tagName);
          },
        },
      ]
    );
  };

  const performDelete = async (tagName) => {
    try {
      setDeleting(tagName);
      await deleteTagFromAllEntries(tagName);
      
      // Remove from UI
      setTags(prevTags => prevTags.filter(tag => tag !== tagName));
      Alert.alert('Success', `Tag "${tagName}" has been deleted`);
    } catch (error) {
      console.error('Error deleting tag:', error);
      Alert.alert('Error', `Failed to delete tag "${tagName}"`);
    } finally {
      setDeleting(null);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('Error', 'Please enter a tag name');
      return;
    }

    // Check if tag already exists
    if (tags.includes(newTagName.trim())) {
      Alert.alert('Error', 'This tag already exists');
      return;
    }

    try {
      setAdding(true);
      await createTag(newTagName.trim());
      setTags(prevTags => [...prevTags, newTagName.trim()].sort());
      setNewTagName('');
      setShowAddModal(false);
      Alert.alert('Success', `Tag "${newTagName}" has been created`);
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('Error', 'Failed to create tag');
    } finally {
      setAdding(false);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTagItem = ({ item: tagName }) => (
    <View style={styles.tagItemContainer}>
      <View style={styles.tagContent}>
        <Ionicons name="pricetag" size={20} color="#007AFF" style={styles.tagIcon} />
        <Text style={styles.tagName}>{tagName}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.deleteButton,
          deleting === tagName && styles.deleteButtonDisabled,
        ]}
        onPress={() => handleDeleteTag(tagName)}
        disabled={deleting === tagName}
      >
        {deleting === tagName ? (
          <ActivityIndicator size="small" color="#FF3B30" />
        ) : (
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ThemeBackground>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </ThemeBackground>
    );
  }

  return (
    <ThemeBackground>
      <ScrollView style={styles.scrollContainer}>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tags..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={18} color={themeStyle.black} />
            </TouchableOpacity>
          )}
        </View>

        {tags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tags yet</Text>
            <Text style={styles.emptySubtext}>
              Create tags when adding entries to manage them here
            </Text>
          </View>
        ) : filteredTags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tags found</Text>
            <Text style={styles.emptySubtext}>
              Try a different search term
            </Text>
          </View>
        ) : (
          <View style={styles.tagsList}>
            {filteredTags.map(tagName => (
              <View key={tagName} style={styles.tagItemContainer}>
                <View style={styles.tagContent}>
                  <Ionicons name="pricetag" size={20} color={themeStyle.darkPurple5} style={styles.tagIcon} />
                  <Text style={styles.tagName}>{tagName}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    deleting === tagName && styles.deleteButtonDisabled,
                  ]}
                  onPress={() => handleDeleteTag(tagName)}
                  disabled={deleting === tagName}
                >
                  {deleting === tagName ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Tag Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Tag</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={themeStyle.black} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.tagInput}
              placeholder="Enter tag name..."
              placeholderTextColor="#999"
              value={newTagName}
              onChangeText={setNewTagName}
              editable={!adding}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewTagName('');
                }}
                disabled={adding}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButton, adding && styles.addButtonDisabled]}
                onPress={handleAddTag}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.addButtonText}>Create Tag</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ThemeBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    color: themeStyle.black,
    fontFamily: 'Montserrat-Bold',
    paddingVertical: 5,
    textAlign: 'center',
    marginTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeStyle.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 16,
    height: 40,
    gap: 8,
  },
  searchIcon: {
    color: themeStyle.black,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: themeStyle.black,
    padding: 0,
  },
  searchBar: {
    marginVertical: 15,
    width: '100%',
  },
  tagsList: {
    gap: 12,
    marginTop: 16,
    paddingBottom: 80,
  },
  tagItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeStyle.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tagIcon: {
    width: 24,
  },
  tagName: {
    fontSize: 15,
    color: themeStyle.black,
    fontWeight: '500',
    fontFamily: 'Montserrat-Regular',
  },
  deleteButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFE5E5',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: themeStyle.black,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 16,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: themeStyle.white,
    borderRadius: 12,
    width: '80%',
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeStyle.black,
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: themeStyle.black,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: themeStyle.black,
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: themeStyle.darkPurple5,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
