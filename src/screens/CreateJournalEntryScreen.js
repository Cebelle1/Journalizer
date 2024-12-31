import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createJournalEntry } from '../services/journalDB';
import BackgroundImage from '../assets/image/journalizer-background-1.png';

export default function CreateJournalEntryScreen({ navigation }){
  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const onSave = () => {
    
    createJournalEntry(date.toISOString(), title, body, tags, (error) => {
      if (error) {
        console.error('Failed to save journal entry:', error);
      } else {
        console.log('Saving journal entry:', date, title, body, tags);
        navigation.navigate("Journals");
      }
    });
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
  container: { padding: 20 },
  dateText: { 
    fontSize: 18, 
    marginBottom: 20 },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    marginBottom: 20, 
    borderRadius: 5 
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
  backgroundImage: {
      flex: 1,
      resizeMode: 'cover',
      justifyContent: 'center',
    },
});
