import * as SQLite from 'expo-sqlite';

const createJournalDB = async () => {
  const db = await SQLite.openDatabaseAsync('JournalDB.db');

  // Drop old schema if it exists (for migration)
  try {
    await db.execAsync(`
      DROP TABLE IF EXISTS entry_tags;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS journal_entries;
    `);
  } catch (error) {
    console.log('No old tables to drop');
  }

  // Initialize the database with new tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      createdAt TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS entry_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entryId INTEGER NOT NULL,
      tagId INTEGER NOT NULL,
      FOREIGN KEY (entryId) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(entryId, tagId)
    );
  `);

  console.log('Database and tables initialized');
  return db;
};

// Store the database instance
let dbInstance = null;
let initializingPromise = null;

// Get the database instance (ensures it's initialized)
const getDBInstance = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  // If initialization is already in progress, wait for it
  if (initializingPromise) {
    return initializingPromise;
  }
  
  // Start initialization
  initializingPromise = createJournalDB();
  dbInstance = await initializingPromise;
  initializingPromise = null;
  
  return dbInstance;
};

// Create a new journal entry
export const createJournalEntry = async ({ date, title, body, tags = [] }) => {
  try {
    const db = await getDBInstance();
    const now = new Date().toISOString();
    
    const result = await db.runAsync(
      `INSERT INTO journal_entries (date, title, body, createdAt) VALUES (?, ?, ?, ?)`,
      [date, title, body, now]
    );
    
    const entryId = result.lastInsertRowId;
    
    // Add tags for this entry
    for (const tagName of tags) {
      const tagResult = await db.runAsync(
        `INSERT OR IGNORE INTO tags (name, createdAt) VALUES (?, ?)`,
        [tagName, now]
      );
      
      const tag = await db.getFirstAsync(`SELECT id FROM tags WHERE name = ?`, [tagName]);
      if (tag) {
        await db.runAsync(
          `INSERT OR IGNORE INTO entry_tags (entryId, tagId) VALUES (?, ?)`,
          [entryId, tag.id]
        );
      }
    }
    
    console.log('Created journal entry with ID:', entryId);
    return entryId;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
};

// Read all journal entries with their tags
export const readAllJournalEntries = async () => {
  try {
    const db = await getDBInstance();
    const entries = await db.getAllAsync(`
      SELECT 
        je.id,
        je.date,
        je.title,
        je.body,
        je.createdAt,
        GROUP_CONCAT(t.name) as tags
      FROM journal_entries je
      LEFT JOIN entry_tags et ON je.id = et.entryId
      LEFT JOIN tags t ON et.tagId = t.id
      GROUP BY je.id
      ORDER BY je.date DESC
    `, []);
    
    return entries ? entries.map(entry => ({
      ...entry,
      tags: entry.tags ? entry.tags.split(',') : []
    })) : [];
  } catch (error) {
    console.error('Error reading journal entries:', error);
    return [];
  }
};

// Search for journal entries
export const searchJournalEntries = async ({startDate, endDate, title, tags = []}) => {
  try {
    const db = await getDBInstance();
    
    let query = `
      SELECT DISTINCT
        je.id,
        je.date,
        je.title,
        je.body,
        je.createdAt,
        GROUP_CONCAT(t.name) as tags
      FROM journal_entries je
      LEFT JOIN entry_tags et ON je.id = et.entryId
      LEFT JOIN tags t ON et.tagId = t.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ` AND je.date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND je.date <= ?`;
      params.push(endDate);
    }
    
    if (title && title.trim()) {
      query += ` AND je.title LIKE ?`;
      params.push(`%${title}%`);
    }
    
    if (tags && tags.length > 0) {
      // Find entries that have ANY of the specified tags
      const tagPlaceholders = tags.map(() => '?').join(',');
      query += ` AND t.name IN (${tagPlaceholders})`;
      params.push(...tags);
    }
    
    query += ` GROUP BY je.id ORDER BY je.date DESC`;
    
    console.log('Executing search query with params:', { query: query.substring(0, 100), paramsCount: params.length });
    const results = await db.getAllAsync(query, params.length > 0 ? params : []);
    
    return results ? results.map(entry => ({
      ...entry,
      tags: entry.tags ? entry.tags.split(',').filter(Boolean) : []
    })) : [];
  } catch (error) {
    console.error('Error searching journal entries:', error);
    return [];
  }
};

// Read a single journal entry with its tags
export const readJournalEntry = async (id) => {
  try {
    if (!id) {
      console.warn('readJournalEntry called with invalid id:', id);
      return null;
    }
    
    const db = await getDBInstance();
    console.log('Reading entry with ID:', id, 'Type:', typeof id);
    
    const result = await db.getFirstAsync(`
      SELECT 
        je.id,
        je.date,
        je.title,
        je.body,
        je.createdAt,
        GROUP_CONCAT(t.name) as tags
      FROM journal_entries je
      LEFT JOIN entry_tags et ON je.id = et.entryId
      LEFT JOIN tags t ON et.tagId = t.id
      WHERE je.id = ?
      GROUP BY je.id
    `, [id]);
    
    if (result) {
      return {
        ...result,
        tags: result.tags ? result.tags.split(',').filter(Boolean) : []
      };
    }
    return null;
  } catch (error) {
    console.error('Error reading journal entry:', error);
    return null;
  }
};

// Update a journal entry
export const updateJournalEntry = async ({ id, date, title, body, tags = [] }) => {
  try {
    const db = await getDBInstance();
    
    // Update entry
    const result = await db.runAsync(
      `UPDATE journal_entries SET date = ?, title = ?, body = ? WHERE id = ?`,
      [date, title, body, id]
    );
    
    // Remove old tag associations
    await db.runAsync(`DELETE FROM entry_tags WHERE entryId = ?`, [id]);
    
    // Add new tag associations
    const now = new Date().toISOString();
    for (const tagName of tags) {
      // Insert tag if it doesn't exist
      await db.runAsync(
        `INSERT OR IGNORE INTO tags (name, createdAt) VALUES (?, ?)`,
        [tagName, now]
      );
      
      // Get tag ID
      const tag = await db.getFirstAsync(`SELECT id FROM tags WHERE name = ?`, [tagName]);
      if (tag) {
        await db.runAsync(
          `INSERT OR IGNORE INTO entry_tags (entryId, tagId) VALUES (?, ?)`,
          [id, tag.id]
        );
      }
    }
    
    console.log('Updated journal entry ID:', id, 'Changes:', result.changes);
    return result.changes;
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
};

// Delete a journal entry
export const deleteJournalEntry = async (id) => {
  try {
    const db = await getDBInstance();
    const result = await db.runAsync(
      `DELETE FROM journal_entries WHERE id = ?`,
      [id]
    );
    console.log('Deleted journal entry ID:', id, 'Changes:', result.changes);
    return result.changes;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
};

// Get all unique tags used across all entries
export const readUniqueTags = async () => {
  try {
    const db = await getDBInstance();
    console.log('Querying all tags from database');
    const result = await db.getAllAsync(`SELECT name FROM tags ORDER BY name ASC`, []);
    console.log('Tags query result:', result);
    return result ? result.map(tag => tag.name) : [];
  } catch (error) {
    console.error('Error reading unique tags:', error);
    return [];
  }
};

// Delete a tag globally (from all entries)
export const deleteTagFromAllEntries = async (tagName) => {
  try {
    const db = await getDBInstance();
    
    const tag = await db.getFirstAsync(`SELECT id FROM tags WHERE name = ?`, [tagName]);
    if (!tag) return;
    
    // Delete all associations with this tag
    await db.runAsync(`DELETE FROM entry_tags WHERE tagId = ?`, [tag.id]);
    
    // Delete the tag itself
    await db.runAsync(`DELETE FROM tags WHERE id = ?`, [tag.id]);
    
    console.log(`Deleted tag "${tagName}" globally`);
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

// Create a new tag
export const createTag = async (tagName) => {
  try {
    const db = await getDBInstance();
    const now = new Date().toISOString();
    
    const result = await db.runAsync(
      `INSERT INTO tags (name, createdAt) VALUES (?, ?)`,
      [tagName, now]
    );
    console.log('Created tag with ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.log('Tag already exists:', tagName);
    return null;
  }
};



// =============FOR TESTING PURPOSES ONLY
const clearDataBase = async () => {
  const db = await getDBInstance();
  await db.runAsync(`DELETE FROM journal_entries`);
};

//clearDataBase();

// =============Test
/*
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
  const entries = await readAllJournalEntries();
  //console.log(entries);

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
  const updatedEntries = await readAllJournalEntries();
  console.log(updatedEntries);
})();
*/
