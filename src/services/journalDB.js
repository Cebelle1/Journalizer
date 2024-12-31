import * as SQLite from 'expo-sqlite';

const createJournalDB = async () => {
  const db = await SQLite.openDatabaseAsync('JournalDB.db');

  // Initialize the database with a journal entries table
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT
    );
  `);

  console.log('Database and journal_entries table initialized');
  return db;
};

// Store the database instance
let dbInstance = null;

// Get the database instance (ensures it's initialized)
const getDBInstance = async () => {
  if (!dbInstance) {
    dbInstance = await createJournalDB();
  }
  return dbInstance;
};

// Create a new journal entry
export const createJournalEntry = async ({ date, title, body, tags }) => {
  const db = await getDBInstance();
  console.log('Creating journal entry:', date, title, body, tags);
  const result = await db.runAsync(
    `INSERT INTO journal_entries (date, title, body, tags) VALUES (?, ?, ?, ?)`,
    date,
    title,
    body,
    JSON.stringify(tags)
  );
  console.log('Created journal entry with ID:', result.lastInsertRowId);
  return result.lastInsertRowId;
};

// Read all journal entries
export const readJournalEntries = async () => {
  const db = await getDBInstance();
  const allRows = await db.getAllAsync(`SELECT * FROM journal_entries`);
  console.log('All journal entries:', allRows);
  return allRows;
};

// Update a journal entry
export const updateJournalEntry = async ({ id, date, title, body, tags }) => {
  const db = await getDBInstance();
  const result = await db.runAsync(
    `UPDATE journal_entries SET date = ?, title = ?, body = ?, tags = ? WHERE id = ?`,
    date,
    title,
    body,
    JSON.stringify(tags),
    id
  );
  console.log('Updated journal entry ID:', id, 'Changes:', result.changes);
  return result.changes;
};

// Delete a journal entry
export const deleteJournalEntry = async (id) => {
  const db = await getDBInstance();
  const result = await db.runAsync(
    `DELETE FROM journal_entries WHERE id = ?`,
    id
  );
  console.log('Deleted journal entry ID:', id, 'Changes:', result.changes);
  return result.changes;
};

// =============Test
(async () => {
  const db = await createJournalDB();
  // Create an entry
  const newEntryId = await createJournalEntry({
    date: '2024-12-28',
    title: 'Journalizer',
    body: 'Journalizer is a journaling app.',
    tags: ['happy', 'memories'],
  });

  // Read entries
  const entries = await readJournalEntries();
  console.log(entries);

  // Update the entry
  await updateJournalEntry(db, {
    id: newEntryId,
    date: '2024-12-30',
    title: 'Updated Title',
    body: 'Updated body content.',
    tags: ['updated', 'journal'],
  });

  // Delete the entry
  //await deleteJournalEntry( newEntryId);

  // Verify deletion
  const updatedEntries = await readJournalEntries();
  console.log(updatedEntries);
})();
