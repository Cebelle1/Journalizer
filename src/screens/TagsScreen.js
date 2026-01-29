import React, { useState, useEffect, useCallback } from 'react';
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
  Dimensions,
  Modal,
} from 'react-native';
import { readUniqueTags, deleteTagFromAllEntries, createTag, updateTagColor } from '../database/journalDB';
import Ionicons from '@expo/vector-icons/Ionicons';
import { themeStyle, ThemeBackground } from '../styles/theme';
import { navigatorStyles, headerSearchStyles, fabStyles, emptyStateStyles } from '../styles/componentStyle';
import { useNavigation, useFocusEffect } from '@react-navigation/native'

export default function TagsScreen() {
  const navigation = useNavigation();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8E44AD');
  const [adding, setAdding] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedTagNames, setSelectedTagNames] = useState([]);
  const selectionActive = selectedTagNames.length > 0;

  // Load all tags on component mount
  useEffect(() => {
    loadTags();
  }, []);

  // Reload tags when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [])
  );

  const loadTags = async () => {
    try {
      setLoading(true);
      const uniqueTags = await readUniqueTags();
      console.log('Loaded tags from readUniqueTags:', uniqueTags);
      setTags(uniqueTags || []);
      // Clear selection if tags change
      setSelectedTagNames((prev) => prev.filter((name) => uniqueTags.some((tag) => tag.name === name)));
    } catch (error) {
      console.error('Error loading tags:', error);
      Alert.alert('Error', 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectTag = (tagName) => {
    setSelectedTagNames((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((name) => name !== tagName);
      }
      return [...prev, tagName];
    });
  };

  const toggleSelectAllTags = () => {
    if (selectedTagNames.length === filteredTags.length) {
      setSelectedTagNames([]);
      return;
    }
    setSelectedTagNames(filteredTags.map((tag) => tag.name));
  };

  const handleDeleteSelected = async () => {
    if (selectedTagNames.length === 0) {
      return;
    }

    Alert.alert(
      'Delete Tags',
      `Are you sure you want to delete ${selectedTagNames.length} selected tag(s)? This will remove them from all entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting('multiple');
            let deletedCount = 0;
            try {
              for (const tagName of selectedTagNames) {
                try {
                  await deleteTagFromAllEntries(tagName);
                  deletedCount += 1;
                } catch (deleteError) {
                  console.error(`Failed to delete tag ${tagName}:`, deleteError);
                }
              }
              setSelectedTagNames([]);
              Alert.alert('Success', `Deleted ${deletedCount} tag(s)`);
              await loadTags();
            } catch (error) {
              console.error('Bulk delete error:', error);
              Alert.alert('Error', 'Failed to delete selected tags');
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
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
      setTags(prevTags => prevTags.filter(tag => tag.name !== tagName));
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
    if (tags.some(tag => tag.name === newTagName.trim())) {
      Alert.alert('Error', 'This tag already exists');
      return;
    }

    try {
      setAdding(true);
      await createTag(newTagName.trim(), newTagColor);
      setTags(prevTags => [...prevTags, { name: newTagName.trim(), color: newTagColor }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTagName('');
      setNewTagColor('#8E44AD');
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
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChangeTagColor = async (tagName, newColor) => {
    try {
      await updateTagColor(tagName, newColor);
      setTags(prevTags => prevTags.map(tag =>
        tag.name === tagName ? { ...tag, color: newColor } : tag
      ));
      setEditingTag(null);
      setShowColorPicker(false);
    } catch (error) {
      console.error('Error updating tag color:', error);
      Alert.alert('Error', 'Failed to update tag color');
    }
  };

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
      <ScrollView style={styles.scrollContainer} stickyHeaderIndices={[0]}>
        
        {/* Sticky Search Bar */}
        <View style={styles.stickySearchWrapper}>
          <View style={headerSearchStyles.searchContainer}>
            <Ionicons name="search-outline" size={20} style={headerSearchStyles.searchIcon} />
            <TextInput
              style={headerSearchStyles.searchInput}
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
        </View>

        {tags.length === 0 ? (
          <View style={emptyStateStyles.emptyContainer}>
            <Ionicons name="pricetag" size={64} color="#ccc" />
            <Text style={emptyStateStyles.emptyText}>No tags yet</Text>
            <Text style={emptyStateStyles.emptySubtext}>
              Create tags when adding entries to manage them here
            </Text>
          </View>
        ) : filteredTags.length === 0 ? (
          <View style={emptyStateStyles.emptyContainer}>
            <Ionicons name="search" size={64} color="#ccc" />
            <Text style={emptyStateStyles.emptyText}>No tags found</Text>
            <Text style={emptyStateStyles.emptySubtext}>
              Try a different search term
            </Text>
          </View>
        ) : (
          <View style={styles.tagsList}>
            {filteredTags.length > 0 && selectionActive && (
              <View style={styles.selectionHeader}>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={toggleSelectAllTags}
                >
                  <Ionicons
                    name={selectedTagNames.length === filteredTags.length ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={themeStyle.darkPurple2}
                  />
                  <Text style={styles.selectAllText}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.bulkDeleteButton,
                    selectedTagNames.length === 0 && styles.bulkDeleteButtonDisabled
                  ]}
                  onPress={handleDeleteSelected}
                  disabled={selectedTagNames.length === 0 || deleting === 'multiple'}
                >
                  {deleting === 'multiple' ? (
                    <ActivityIndicator size="small" color={themeStyle.white} />
                  ) : (
                    <>
                      <Ionicons name="trash" size={16} color={themeStyle.white} />
                      <Text style={styles.bulkDeleteText}>Delete ({selectedTagNames.length})</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
            {filteredTags.map(tag => (
              <TouchableOpacity
                key={tag.name}
                style={styles.tagItemContainer}
                activeOpacity={0.9}
                onLongPress={() => toggleSelectTag(tag.name)}
                onPress={() => {
                  if (selectionActive) {
                    toggleSelectTag(tag.name);
                  }
                }}
              >
                {selectionActive && (
                  <TouchableOpacity
                    style={styles.checkboxButton}
                    onPress={() => toggleSelectTag(tag.name)}
                  >
                    <Ionicons
                      name={selectedTagNames.includes(tag.name) ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={themeStyle.darkPurple2}
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.tagContent}>
                  <TouchableOpacity
                    style={[styles.colorDot, { backgroundColor: tag.color }]}
                    onPress={() => {
                      if (!selectionActive) {
                        setEditingTag(tag.name);
                        setShowColorPicker(true);
                      }
                    }}
                  />
                  <Text style={styles.tagName}>{tag.name}</Text>
                </View>
                {!selectionActive && (
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      deleting === tag.name && styles.deleteButtonDisabled,
                    ]}
                    onPress={() => handleDeleteTag(tag.name)}
                    disabled={deleting === tag.name}
                  >
                    {deleting === tag.name ? (
                      <ActivityIndicator size="small" color="#FF3B30" />
                    ) : (
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={fabStyles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Tag Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Tag</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setNewTagName('');
                setNewTagColor('#8E44AD');
              }}>
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

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Warm Colors */}
              <Text style={styles.colorCategoryTitle}>Warm Colors</Text>
              <View style={styles.colorGridLarge}>
                {['#821A1A', '#E74C3C', '#FFA07A', '#FF9900', '#FFD93D', '#FFF3D1'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOptionLarge,
                      { backgroundColor: color },
                      newTagColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setNewTagColor(color)}
                  >
                    {newTagColor === color && (
                      <Ionicons name="checkmark" size={24} color={themeStyle.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cool Colors */}
              <Text style={styles.colorCategoryTitle}>Cool Colors</Text>
              <View style={styles.colorGridLarge}>
                {['#141480', '#0059ff', '#00CED1', '#007222', '#01b94e', '#93f393'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOptionLarge,
                      { backgroundColor: color },
                      newTagColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setNewTagColor(color)}
                  >
                    {newTagColor === color && (
                      <Ionicons name="checkmark" size={24} color={themeStyle.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Purple & Pink Colors */}
              <Text style={styles.colorCategoryTitle}>Purple & Pink</Text>
              <View style={styles.colorGridLarge}>
                {['#7300a0', '#ec47f1', '#ebb1fa', '#ca00b9', '#DA70D6', '#C39BD3'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOptionLarge,
                      { backgroundColor: color },
                      newTagColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setNewTagColor(color)}
                  >
                    {newTagColor === color && (
                      <Ionicons name="checkmark" size={24} color={themeStyle.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Neutral Colors */}
              <Text style={styles.colorCategoryTitle}>Neutral Colors</Text>
              <View style={styles.colorGridLarge}>
                {['#34495E', '#546E7A', '#607D8B', '#7F8C8D', '#95A5A6', '#000000'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOptionLarge,
                      { backgroundColor: color },
                      newTagColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setNewTagColor(color)}
                  >
                    {newTagColor === color && (
                      <Ionicons name="checkmark" size={24} color={themeStyle.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewTagName('');
                  setNewTagColor('#8E44AD');
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

      {/* Color Picker Modal */}
      {showColorPicker && editingTag && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Color for "{editingTag}"</Text>
              <TouchableOpacity onPress={() => {
                setShowColorPicker(false);
                setEditingTag(null);
              }}>
                <Ionicons name="close" size={24} color={themeStyle.black} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Warm Colors */}
              <Text style={styles.colorCategoryTitle}>Warm Colors</Text>
              <View style={styles.colorGridLarge}>
                {['#821A1A', '#E74C3C', '#FFA07A', '#FF9900', '#FFD93D', '#FFF3D1'].map((color) => {
                  const currentTagColor = tags.find(t => t.name === editingTag)?.color || '#8E44AD';
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOptionLarge,
                        { backgroundColor: color },
                        currentTagColor === color && styles.colorOptionSelected
                      ]}
                      onPress={() => handleChangeTagColor(editingTag, color)}
                    >
                      {currentTagColor === color && (
                        <Ionicons name="checkmark" size={24} color={themeStyle.white} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Cool Colors */}
              <Text style={styles.colorCategoryTitle}>Cool Colors</Text>
              <View style={styles.colorGridLarge}>
                {['#141480', '#0059ff', '#00CED1', '#007222', '#01b94e', '#93f393'].map((color) => {
                  const currentTagColor = tags.find(t => t.name === editingTag)?.color || '#8E44AD';
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOptionLarge,
                        { backgroundColor: color },
                        currentTagColor === color && styles.colorOptionSelected
                      ]}
                      onPress={() => handleChangeTagColor(editingTag, color)}
                    >
                      {currentTagColor === color && (
                        <Ionicons name="checkmark" size={24} color={themeStyle.white} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Purple & Pink Colors */}
              <Text style={styles.colorCategoryTitle}>Purple & Pink</Text>
              <View style={styles.colorGridLarge}>
                {['#7300a0', '#ec47f1', '#ebb1fa', '#ca00b9', '#DA70D6', '#C39BD3'].map((color) => {
                  const currentTagColor = tags.find(t => t.name === editingTag)?.color || '#8E44AD';
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOptionLarge,
                        { backgroundColor: color },
                        currentTagColor === color && styles.colorOptionSelected
                      ]}
                      onPress={() => handleChangeTagColor(editingTag, color)}
                    >
                      {currentTagColor === color && (
                        <Ionicons name="checkmark" size={24} color={themeStyle.white} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Neutral Colors */}
              <Text style={styles.colorCategoryTitle}>Neutral Colors</Text>
              <View style={styles.colorGridLarge}>
                {['#34495E', '#546E7A', '#607D8B', '#7F8C8D', '#95A5A6', '#000000'].map((color) => {
                  const currentTagColor = tags.find(t => t.name === editingTag)?.color || '#8E44AD';
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOptionLarge,
                        { backgroundColor: color },
                        currentTagColor === color && styles.colorOptionSelected
                      ]}
                      onPress={() => handleChangeTagColor(editingTag, color)}
                    >
                      {currentTagColor === color && (
                        <Ionicons name="checkmark" size={24} color={themeStyle.white} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </ThemeBackground>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const COLOR_BUTTON_SIZE = ((screenWidth * 0.9 - 40 - 28) / 3) * 0.85; // 90% modal width - padding - gaps, reduced by 15%

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stickySearchWrapper: {
    backgroundColor: themeStyle.background,
    paddingVertical: 5,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 30,
    color: themeStyle.black,
    fontFamily: 'Montserrat-Bold',
    paddingVertical: 5,
    textAlign: 'center',
    marginTop: 20,
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
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(142, 68, 173, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.2)',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeStyle.darkPurple2,
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkDeleteButtonDisabled: {
    opacity: 0.5,
  },
  bulkDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeStyle.white,
  },
  checkboxButton: {
    padding: 4,
    marginRight: 8,
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
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
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
    marginBottom: 10,
  },
  colorPickerSection: {
    gap: 10,
  },
  colorPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: themeStyle.black,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  colorGridLarge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    marginBottom: 16,
  },
  colorOption: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionLarge: {
    width: COLOR_BUTTON_SIZE,
    height: COLOR_BUTTON_SIZE,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorOptionSelected: {
    borderColor: themeStyle.black,
    borderWidth: 3,
  },
  colorCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeStyle.black,
    marginBottom: 12,
    marginTop: 8,
  },
  modalContentLarge: {
    backgroundColor: themeStyle.white,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 10,
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
