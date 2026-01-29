import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ImageBackground, Modal,
  Dimensions, ActivityIndicator, 
  KeyboardAvoidingView, Keyboard, Image, FlatList, Alert} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

// DB and Modals
import { readJournalEntry, updateJournalEntry, createJournalEntry, readUniqueTags, deleteTagFromAllEntries } from '../database/journalDB';
import TagModal from '../components/TagModal';
import TagList from '../components/TagList';

// Assets and Styles
import { themeStyle, ThemeBackground } from '../styles/theme';
import { calculateFontSize } from '../utils/fontSizeUtils';
import { useFontSize } from '../context/FontSizeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

// Used to prevent the keyboard from shifting the background image
const d = Dimensions.get('window');

export default function JournalEntryScreen({ navigation, route }){
  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);
  const [allAvailableTags, setAllAvailableTags] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const entryId  = route.params?.id ?? null; //Get entryId if its updating an existing entry
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const { fontSizeMultiplier } = useFontSize();
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      setCurrentImageIndex(idx);
    }
  });

  // Load the save icon in header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={onSave} style={{ marginRight: 15 }}>
          <Ionicons name="save-outline" size={24} color={themeStyle.black} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, onSave, body, title, tags, date, images]);

  // Load existing entry if entryId is provided
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all unique tags from database
        const uniqueTags = await readUniqueTags();
        setAllAvailableTags(uniqueTags || []);

        if (entryId) {
          // Load the entry from the database
          const entry = await readJournalEntry(entryId);
          if (entry) {
            setDate(new Date(entry.date));
            setTitle(entry.title || '');
            setBody(entry.body || '');
            // Keep tags as objects with color information
            setTags(Array.isArray(entry.tags) ? entry.tags : []);
            setImages(Array.isArray(entry.images) ? entry.images : []);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [entryId]);

  // When keyboard is open, immediately scroll to end
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Scroll to the bottom of the ScrollView when the keyboard opens
      scrollViewRef.current?.scrollToEnd({ animated: true });
      setKeyboardOpen(true);
    });

    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () =>{
      setKeyboardOpen(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  })
  
  // When Save Icon is pressed
  const onSave = async() => {
    try {
      // Extract tag names for saving to database
      const tagNames = tags.map(t => typeof t === 'string' ? t : t.name);
      
      if (entryId) {
        // Update the existing entry
        await updateJournalEntry({
          id: entryId,
          date: date.toISOString(),
          title: title,
          body: body,
          tags: tagNames,
          images: images
        });
      } else {
        // Check if body is empty
        if (body.trim() === '') {
          alert('Please enter a journal entry');
          return;
        }
       await createJournalEntry({
        date: date.toISOString(),
        title: title,
        body: body,
        tags: tagNames,
        images: images
      });
    }
      navigation.navigate('JournalScreen');
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    }
  };
  
  // Handle adding a tag
  const addTag = (tag) => {
    const tagName = typeof tag === 'string' ? tag : tag.name;
    if (tagName.trim() !== '') {
      setTags(prevTags => {
        // Add tag if not in list (check by name)
        const tagExists = prevTags.some(t => {
          const existingName = typeof t === 'string' ? t : t.name;
          return existingName === tagName;
        });
        if (!tagExists) {
          // Find the tag object from allAvailableTags
          const tagObj = allAvailableTags.find(t => t.name === tagName);
          return [...prevTags, tagObj || { name: tagName, color: '#8E44AD' }];
        }
        alert('Tag already exists');
        return prevTags;
      });
    }
    setTagModalVisible(false);
  };

  const deleteTag = (tag) => {
    // Remove tag from current entry only
    const tagName = typeof tag === 'string' ? tag : tag.name;
    setTags(prevTags => prevTags.filter(t => {
      const tName = typeof t === 'string' ? t : t.name;
      return tName !== tagName;
    }));
  };

  const pickImages = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Permission to access the media library is required.');
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const openImageViewer = (uri) => {
    setViewerUri(uri);
    setViewerVisible(true);
  };

  const closeImageViewer = () => {
    setViewerVisible(false);
    setViewerUri(null);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  // Generate styles with dynamic font sizes
  const dynamicStyles = createDynamicStyles(fontSizeMultiplier);

  return (  
    <ThemeBackground>
      <KeyboardAvoidingView
        behavior='height'
        style={{ flex: 1 }}
      >
      <ScrollView 
        contentContainerStyle={dynamicStyles.container}
        flexGrow={1}
        nestedScrollEnabled={true}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps="never"
        showsVerticalScrollIndicator={true}
        ref={scrollViewRef}>
          
          {/* Date Text that expands to Date Picker */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <View style={dynamicStyles.dateContainer}>  
            <Ionicons name="calendar" size={20} style={dynamicStyles.dateIcon} />
            <Text style={dynamicStyles.dateText}>{date.toDateString()}</Text>
          </View>
          
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Tag Picker */}
        <TouchableOpacity onPress={() => setTagModalVisible(true)}>
          {/* Display individual tags */}
          <TagList tags={tags} />
        </TouchableOpacity>

        {/* Tag Modal */}
        <TagModal
          visible={tagModalVisible}
          onClose={() => setTagModalVisible(false)}
          onAddTag={addTag}
          onRemoveTag={deleteTag}
          currentTags={tags}
          allTags={allAvailableTags}
        />

        
        {/* Title Inputs */}
        <TextInput
          placeholder="Title [Optional]"
          placeholderTextColor="#999"
          style={[dynamicStyles.input, dynamicStyles.titleInput]}
          value={title}
          multiline
          numberOfLines={2}
          onChangeText={setTitle}
        />

        {/* Image area */}
        {images.length === 0 ? (
          <TouchableOpacity onPress={pickImages} style={dynamicStyles.addBox}>
            <Ionicons name="add-circle-outline" size={24} color="#888" />
            <Text style={dynamicStyles.addBoxText}>Add images</Text>
          </TouchableOpacity>
        ) : (
          <View style={dynamicStyles.carouselContainer}>
            <FlatList
              data={images}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEnabled={images.length > 1}
              decelerationRate="fast"
              snapToInterval={d.width - 30}
              snapToAlignment="center"
              contentContainerStyle={dynamicStyles.carouselContent}
              onViewableItemsChanged={onViewableItemsChanged.current}
              viewabilityConfig={viewabilityConfig.current}
              renderItem={({ item, index }) => (
                <View style={dynamicStyles.carouselItemWrapper}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => openImageViewer(item)}>
                    <Image source={{ uri: item }} style={dynamicStyles.carouselImage} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={dynamicStyles.carouselRemoveButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            />
            <Text style={dynamicStyles.carouselCounter}>{currentImageIndex + 1} / {images.length}</Text>
            
            <TouchableOpacity style={dynamicStyles.carouselAddButton} onPress={pickImages}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Body Input */}
        <TextInput
          placeholder="Write your journal..."
          placeholderTextColor="#999"
          style={[dynamicStyles.input, dynamicStyles.bodyInput]}
          multiline
          value={body}
          onChangeText={setBody}
          onContentSizeChange={() => {
            // Scroll to the bottom only if it's not the initial load
            if (isKeyboardOpen) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={viewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={dynamicStyles.viewerBackdrop}>
          <TouchableOpacity style={dynamicStyles.viewerClose} onPress={closeImageViewer}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={dynamicStyles.viewerContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            centerContent={true}
            bouncesZoom={true}
          >
            {viewerUri && (
              <Image
                source={{ uri: viewerUri }}
                style={dynamicStyles.viewerImage}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </ThemeBackground>
  );
};

const createDynamicStyles = (fontSizeMultiplier) => StyleSheet.create({
  container: { 
    padding: 15,
    flexGrow: 1,
    paddingBottom: 100, // Add bottom padding so the save button doesn't overlap with the keyboard
   },
  dateContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 5,
  },
  dateIcon: {
    marginRight: 5,
    padding: 5,
    color: themeStyle.black,
  },
  dateText: { 
    fontSize: calculateFontSize(20, fontSizeMultiplier), 
    fontFamily: 'Montserrat-Bold',
    color: themeStyle.black,
  },
  input: { 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 8,
    backgroundColor: themeStyle.white,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    },
  titleInput: { 
    fontSize: calculateFontSize(20, fontSizeMultiplier),
    fontFamily: 'Montserrat-Bold',
    padding: 5,
    color: themeStyle.black,
    marginBottom: 10,
    marginTop: 5,
   },
  bodyInput: { 
    flex: 1,
    flexGrow: 1,
    height: '30%',    // Flexible height
    fontFamily: 'Montserrat-Regular',
    fontSize: calculateFontSize(16, fontSizeMultiplier),
  },
  addBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: themeStyle.white,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cfcfcf',
    marginBottom: 14,
  },
  addBoxText: {
    fontSize: calculateFontSize(15, fontSizeMultiplier),
    fontWeight: '700',
    color: '#777',
  },
  carouselContainer: {
    marginTop: 10,
    height: 220,
    borderRadius: 12,
    overflow: 'visible',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  carouselContent: {
    paddingHorizontal: 0,
  },
  carouselItemWrapper: {
    width: d.width - 30,
    height: 190,
    position: 'relative',
    marginHorizontal: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  carouselRemoveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 18,
    padding: 6,
    zIndex: 3,
  },
  carouselCounter: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    color: '#fff',
    fontSize: calculateFontSize(12, fontSizeMultiplier),
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  carouselAddButton: {
    position: 'absolute',
    bottom: 40,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 3,
    borderWidth: 0,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  carouselDotActive: {
    backgroundColor: '#fff',
    width: 10,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 5,
    padding: 10,
  },
  viewerContent: {
    minHeight: '100%',
    minWidth: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: d.width,
    height: d.height,
    resizeMode: 'contain',
  },
});

const styles = StyleSheet.create({
  container: { 
    padding: 15,
    flexGrow: 1,
    paddingBottom: 100, // Add bottom padding so the save button doesn't overlap with the keyboard
   },
  dateContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 5,
  },
  dateIcon: {
    marginRight: 5,
    padding: 5,
    color: themeStyle.black,
  },
  dateText: { 
    fontSize: 20, 
    fontFamily: 'Montserrat-Bold',
    color: themeStyle.black,
  },
  input: { 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 8,
    backgroundColor: themeStyle.white,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    },
  titleInput: { 
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    padding: 5,
    color: themeStyle.black,
    marginBottom: 10,
    marginTop: 5,
   },
  bodyInput: { 
    flex: 1,
    flexGrow: 1,
    height: '30%',    // Flexible height
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
  },
  addBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: themeStyle.white,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cfcfcf',
    marginBottom: 14,
  },
  addBoxText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#777',
  },
  carouselContainer: {
    marginTop: 10,
    height: 220,
    borderRadius: 12,
    overflow: 'visible',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  carouselContent: {
    paddingHorizontal: 0,
  },
  carouselItemWrapper: {
    width: d.width - 30,
    height: 190,
    position: 'relative',
    marginHorizontal: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  carouselRemoveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 18,
    padding: 6,
    zIndex: 3,
  },
  carouselCounter: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  carouselAddButton: {
    position: 'absolute',
    bottom: 40,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 3,
    borderWidth: 0,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  carouselDotActive: {
    backgroundColor: '#fff',
    width: 10,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 5,
    padding: 10,
  },
  viewerContent: {
    minHeight: '100%',
    minWidth: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: d.width,
    height: d.height,
    resizeMode: 'contain',
  },
});

