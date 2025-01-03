import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity,
        StyleSheet, ScrollView, ImageBackground, 
        Dimensions, ActivityIndicator, 
        KeyboardAvoidingView, Keyboard} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// DB and Modals
import { readJournalEntry, updateJournalEntry, createJournalEntry } from '../services/journalDB';
import TagModal from '../components/TagModal';
import Tags from '../components/Tags';

// Assets and Styles
import { themeStyle } from '../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotebookBG from '../assets/image/notebook-background-5.png'


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
  const scrollViewRef = useRef(null);
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);

  // Load the save icon in header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={onSave} style={{ marginRight: 15 }}>
          <Ionicons name="save-outline" size={24} color={themeStyle.beigeWhite1} />
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
  
  // Handle adding a tag
  const addTag = (tag) => {
    if (tag.trim() !== '') {
      setTags(prevTags => {
        // Add tag if not in list
        if (!prevTags.includes(tag)) {
          return [...prevTags, tag.trim()];
        }
        alert('Tag already exists');
        return prevTags;
      });
    }
    setTagModalVisible(false);
  };

  const deleteTag = (tag) => {
    setTags(prevTags => {
      return prevTags.filter(t => t !== tag);
    });
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (  
    <ImageBackground  style={styles.backgroundImage}>
      <KeyboardAvoidingView
        behavior='height'
        style={{ flex: 1 }}
      >
      <ScrollView 
        contentContainerStyle={styles.container}
        flexGrow={1}
        keyboardShouldPersistTaps="never"
        ref={scrollViewRef}>

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
          {/* Display individual tags */}
          <Tags tags={tags} />
        </TouchableOpacity>

        {/* Tag Modal */}
        <TagModal
          visible={tagModalVisible}
          onClose={() => setTagModalVisible(false)}
          onAddTag={(addTag)}
          onDeleteTag={(deleteTag)}
          tags={tags}   // Pass current tags to display in modal
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
          onContentSizeChange={() => {
            // Scroll to the bottom only if it's not the initial load
            if (isKeyboardOpen) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
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
    color: themeStyle.beigeWhite1,
  },
  dateText: { 
    fontSize: 20, 
    fontFamily: 'Montserrat-Bold',
    color: themeStyle.beigeWhite1,
  },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 5,
    backgroundColor: themeStyle.beigeWhite1,
    borderBlockColor: themeStyle.darkBrown,
    borderColor: themeStyle.coffeeBrown,
    textAlignVertical: 'top',
    },
  titleInput: { 
    fontSize: 22,
    fontFamily: 'GenBasB',
    padding: 5,
    marginBottom: 10,
    marginTop: 5,
   },
  bodyInput: { 
    flex: 1,
    flexGrow: 1,
    height: '30%',    // Flexible height
    fontFamily: 'GenBasR',
    fontSize: 18,
  },
  backgroundImage: {        // Absolute position to prevent keyboard from shifting the background image
    position: 'absolute',
    flex: 1,
    width: d.width,
    height: d.height,
    backgroundColor: themeStyle.darkBrown
    },
});
