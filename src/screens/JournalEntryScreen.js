import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Dimensions, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { readJournalEntry, updateJournalEntry, createJournalEntry } from '../services/journalDB';
import BackgroundImage from '../assets/image/journalizer-background-1.png';
import LibraryBG from '../assets/image/library-background-6.png';
import TagModal from '../components/TagModal';
import { themeStyle } from '../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Used to prevent the keyboard from shifting the background image
const d = Dimensions.get('window');

export default function JournalEntryScreen({ navigation, route }){
  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const entryId  = route.params?.id ?? null; //Get entryId if its updating an existing entry
  const [loading, setLoading] = useState(true);

  // Load the save icon in header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={onSave} style={{ marginRight: 15 }}>
          <Ionicons name="save-outline" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, onSave, body, title, tags, date]);  // onSave does not receive the latest state values without this dependency array

  // Load existing entry if entryId is provided
  useEffect(() => {
    if (entryId) {
      const loadEntry = async () => {
        // Load the entry from the database
        setLoading(true);
        const entry = await readJournalEntry(entryId);
        //console.log('Loaded entry:', entry);
        if (entry) {
          setDate(new Date(entry.date));
          setTitle(entry.title);
          setBody(entry.body);
          setTags(JSON.parse(entry.tags));
        }
        
      };
      loadEntry();
    }
    setLoading(false);
  }, [entryId]);

  // When Save Icon is pressed
  const onSave = async() => {
    try {
      if (entryId) {
        // Update the existing entry
        await updateJournalEntry({
          id: entryId,
          date: date.toISOString(),
          title: title,
          body: body,
          tags: tags
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
        tags: tags,
      });
    }
      navigation.navigate('JournalScreen');
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    }
  };

  const addTag = (tag) => {
    if (tag.trim() !== '') {
      setTags(prevTags => {
        if (!prevTags.includes(tag)) {
          return [...prevTags, tag];
        }
        const newTags = [...prevTags, tag.trim()];
        return newTags;
      });
    }
    setTagModalVisible(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (  
    <ImageBackground source={LibraryBG} style={styles.backgroundImage}>
      <ScrollView 
        contentContainerStyle={styles.container}
        flexGrow={1}
        keyboardShouldPersistTaps="handled">

          {/* Date Text that expands to Date Picker */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <View style={styles.dateContainer}>  
            <Ionicons name="calendar" size={20} style={styles.dateIcon} />
            <Text style={styles.dateText}>{date.toDateString()}</Text>
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
          <View style={styles.tagsContainer}>
            <Ionicons name="pricetag-outline" size={20} style={styles.tagIcon} />
            {/** Display individual tags */}
            {tags.map((tag, index) => (
              <View key={index} style={[styles.tag, styles.tagBorder]}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Tag Modal */}
        <TagModal
          visible={tagModalVisible}
          onClose={() => setTagModalVisible(false)}
          onAddTag={(addTag)}
          tags={tags}
        />
        
        {/* Title Inputs */}
        <TextInput
          placeholder="Title [Optional]"
          style={[styles.input, styles.titleInput]}
          value={title}
          multiline
          numberOfLines={2}
          onChangeText={setTitle}
        />

        {/* Body Input */}
        <TextInput
          placeholder="Write your journal..."
          style={[styles.input, styles.bodyInput]}
          multiline
          value={body}
          onChangeText={setBody}
        />
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  keyboardAvWContainer: { flex: 1 },
  container: { 
    padding: 20,
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
    color: themeStyle.white,
  },
  dateText: { 
    fontSize: 20, 
    fontFamily: 'Montserrat-Bold',
    color: themeStyle.white,
  },
  tagsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 10,
    },
  tagIcon: {
    marginRight: 5,
    padding: 5,
    color: themeStyle.white,
  },
  tagText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: themeStyle.black,
  },
  tag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    margin: 3,
  },
  tagBorder: {
    borderWidth: 1,
    backgroundColor: themeStyle.white,
    borderColor: themeStyle.white,
    borderRadius: 20,
    opacity: 0.7, 
  },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 5,
    backgroundColor: themeStyle.lightPurpleTint,
    textAlignVertical: 'top',
    },
  titleInput: { 
    fontSize: 22,
    fontFamily: 'GenBasB',
    padding: 5,
    marginBottom: 10,
   },
  bodyInput: { 
    flex: 1,
    flexGrow: 1,
    height: '30%',    // Flexible height
    fontFamily: 'GenBasR',
    fontSize: 18,
  },
  fab: { 
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeStyle.darkPurple1, 
    borderRadius: 25, 
    paddingVertical: 10,
    paddingHorizontal: 30,
    elevation: 5, // Add a shadow for Android
    shadowColor: '#000', // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: { 
    color: themeStyle.white, 
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  backgroundImage: {        // Absolute position to prevent keyboard from shifting the background image
    position: 'absolute',
    flex: 1,
    width: d.width,
    height: d.height
    },
});
