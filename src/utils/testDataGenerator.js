import { createJournalEntry, deleteJournalEntry, readAllJournalEntries } from '../database/journalDB';

// Create 300 test entries
export const createTestEntries = async () => {
  console.log('Creating 300 test entries...');
  const startDate = new Date(2023, 0, 1);
  
  for (let i = 0; i < 300; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    await createJournalEntry({
      date: date.toISOString(),
      title: `Test Entry ${i + 1}`,
      body: `This is test entry number ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      tags: i % 5 === 0 ? ['test', 'sample'] : i % 3 === 0 ? ['demo'] : [],
      images: []
    });
    
    if ((i + 1) % 50 === 0) {
      console.log(`Created ${i + 1} entries...`);
    }
  }
  
  console.log('✅ Successfully created 300 test entries!');
};

// Delete all test entries (or all entries)
export const deleteAllTestEntries = async () => {
  console.log('Deleting all entries...');
  const allEntries = await readAllJournalEntries();
  
  console.log(`Found ${allEntries.length} entries to delete`);
  
  for (let i = 0; i < allEntries.length; i++) {
    await deleteJournalEntry(allEntries[i].id);
    
    if ((i + 1) % 50 === 0) {
      console.log(`Deleted ${i + 1} entries...`);
    }
  }
  
  console.log('✅ Successfully deleted all entries!');
};

// Delete only entries with "Test Entry" in title
export const deleteOnlyTestEntries = async () => {
  console.log('Deleting test entries...');
  const allEntries = await readAllJournalEntries();
  const testEntries = allEntries.filter(entry => entry.title?.includes('Test Entry'));
  
  console.log(`Found ${testEntries.length} test entries to delete`);
  
  for (let i = 0; i < testEntries.length; i++) {
    await deleteJournalEntry(testEntries[i].id);
    
    if ((i + 1) % 50 === 0) {
      console.log(`Deleted ${i + 1} test entries...`);
    }
  }
  
  console.log('✅ Successfully deleted all test entries!');
};
