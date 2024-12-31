import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { readJournalEntry, updateJournalEntry, createJournalEntry } from '../services/journalDB';
import BackgroundImage from '../assets/image/journalizer-background-1.png';

// Used to prevent the keyboard from shifting the background image
const d = Dimensions.get('window');

export default function JournalEntryScreen({ navigation, route }){
  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const entryId  = route.params.id || {}; //Get entryId if its updating an existing entry

  // Load existing entry if entryId is provided
  useEffect(() => {
    if (entryId) {
      const loadEntry = async () => {
        // Load the entry from the database
        const entry = await readJournalEntry(entryId);
        console.log('Loaded entry:', entry);
        if (entry) {
          setDate(new Date(entry.date));
          setTitle(entry.title);
          setBody(entry.body);
          
        }
      };
      loadEntry();
    }
  }, [entryId]);

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

  return (
    
    <ImageBackground source={BackgroundImage} style={styles.backgroundImage}>
      <ScrollView contentContainerStyle={styles.container}>
          {/* Date Text that expands to Date Picker */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{date.toDateString()}</Text>
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

        <TextInput
          placeholder="Title"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Write your journal..."
          style={[styles.input, styles.bodyInput]}
          multiline
          value={body}
          onChangeText={setBody}
        />
        <TouchableOpacity
          style={styles.tagButton}
          onPress={() => {
            const newTag = prompt('Enter a tag:');
            if (newTag) setTags([...tags, newTag]);
          }}
        >
          <Text style={styles.tagButtonText}>Add Tag</Text>

        </TouchableOpacity>
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Text key={index} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
        <Button title="Save" onPress={onSave} />

      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  keyboardAvWContainer: { flex: 1 },
  container: { padding: 20 },
  dateText: { 
    fontSize: 18, 
    marginBottom: 20 },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    marginBottom: 20, 
    borderRadius: 5,
    backgroundColor: '#ffffff',
    opacity: 0.9
    },
  bodyInput: { height: 150 },
  tagButton: { 
    backgroundColor: 'lightgray', 
    padding: 10, 
    borderRadius: 5, 
    alignItems: 'center' 
    },
  tagButtonText: { fontSize: 16 },
  tagsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 20 
    },
  tag: { 
    backgroundColor: '#e0e0e0', 
    margin: 5, 
    padding: 5, 
    borderRadius: 5 
    },
  backgroundImage: {        // Absolute position to prevent keyboard from shifting the background image
    position: 'absolute',
    flex: 1,
    width: d.width,
    height: d.height
    },
});
