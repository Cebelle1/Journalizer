import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

const createJournalDB = async () => {
  try {
    console.log('Opening database...');
    const db = await SQLite.openDatabaseAsync('JournalDB.db');
    console.log('✓ Database connection opened');
    return db;
  } catch (error) {
    console.error('✗ Error opening database:', error);
    console.log('Attempting to reset database...');
    
    try {
      // Try to delete the corrupted database file
      const dbPath = `${FileSystem.getConstants().documentDirectory}SQLite/JournalDB.db`;
      console.log('Deleting corrupted database at:', dbPath);
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      
      // Try opening again
      console.log('Reopening database after reset...');
      const db = await SQLite.openDatabaseAsync('JournalDB.db');
      console.log('✓ Database reset and reopened successfully');
      return db;
    } catch (resetError) {
      console.error('✗ Failed to reset database:', resetError);
      throw error;
    }
  }
};

// Initialize tables on first use
const initializeTables = async (db) => {
  try {
    console.log('Initializing tables...');
    
    try {
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          createdAt TEXT NOT NULL
        )
      `);
      console.log('✓ Tags table ready');
    } catch (err) {
      console.error('Error creating tags table:', err);
      throw err;
    }
    
    try {
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          images TEXT,
          createdAt TEXT NOT NULL
        )
      `);
      console.log('✓ Journal entries table ready');
    } catch (err) {
      console.error('Error creating journal_entries table:', err);
      throw err;
    }
    
    try {
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS entry_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entryId INTEGER NOT NULL,
          tagId INTEGER NOT NULL,
          FOREIGN KEY (entryId) REFERENCES journal_entries(id) ON DELETE CASCADE,
          FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE,
          UNIQUE(entryId, tagId)
        )
      `);
      console.log('✓ Entry tags table ready');
    } catch (err) {
      console.error('Error creating entry_tags table:', err);
      throw err;
    }
    
    console.log('✓ Tables initialized');
  } catch (error) {
    console.error('✗ Error initializing tables:', error);
    console.log('Attempting to recover by deleting and recreating database...');
    
    try {
      // Close any open connections
      if (db) {
        try {
          await db.closeAsync?.();
        } catch (e) {
          console.log('Database already closed');
        }
      }
      
      // Reset the instance
      dbInstance = null;
      initializingPromise = null;
      
      // Delete corrupted database
      const dbPath = `${FileSystem.getConstants().documentDirectory}SQLite/JournalDB.db`;
      console.log('Deleting corrupted database at:', dbPath);
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      
      // Retry
      console.log('Retrying database initialization...');
      const newDb = await createJournalDB();
      await initializeTables(newDb);
      return newDb;
    } catch (recoveryError) {
      console.error('✗ Recovery failed:', recoveryError);
      throw error;
    }
  }
};

// Store the database instance
let dbInstance = null;
let initializingPromise = null;

// Reset the database instance (used after operations that might corrupt the connection)
const resetDBInstance = () => {
  console.log('Resetting database instance');
  dbInstance = null;
  initializingPromise = null;
};

// Get the database instance (ensures it's initialized)
const getDBInstance = async () => {
  try {
    if (dbInstance) {
      return dbInstance;
    }
    
    // If initialization is already in progress, wait for it
    if (initializingPromise) {
      return initializingPromise;
    }
    
    // Start initialization
    console.log('Initializing database...');
    initializingPromise = (async () => {
      const db = await createJournalDB();
      const result = await initializeTables(db);
      // initializeTables might return a new db instance if recovery happened
      const finalDb = result || db;
      console.log('✓ Database instance ready');
      return finalDb;
    })();
    
    dbInstance = await initializingPromise;
    initializingPromise = null;
    
    return dbInstance;
  } catch (error) {
    console.error('✗ Failed to get database instance:', error);
    initializingPromise = null;
    dbInstance = null;
    throw error;
  }
};

// Create a new journal entry
export const createJournalEntry = async ({ date, title, body, tags = [], images = [] }) => {
  try {
    const db = await getDBInstance();
    const now = new Date().toISOString();
    const imagesJSON = images.length > 0 ? JSON.stringify(images) : null;
    
    const result = await db.runAsync(
      `INSERT INTO journal_entries (date, title, body, images, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [date, title, body, imagesJSON, now]
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
        je.images,
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
        tags: result.tags ? result.tags.split(',').filter(Boolean) : [],
        images: result.images ? JSON.parse(result.images) : []
      };
    }
    return null;
  } catch (error) {
    console.error('Error reading journal entry:', error);
    return null;
  }
};

// Update a journal entry
export const updateJournalEntry = async ({ id, date, title, body, tags = [], images = [] }) => {
  try {
    const db = await getDBInstance();
    const imagesJSON = images.length > 0 ? JSON.stringify(images) : null;
    
    // Update entry
    const result = await db.runAsync(
      `UPDATE journal_entries SET date = ?, title = ?, body = ?, images = ? WHERE id = ?`,
      [date, title, body, imagesJSON, id]
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



// Export all data for backup
export const exportAllData = async () => {
  try {
    const db = await getDBInstance();
    
    // Get all journal entries with images
    const entries = await db.getAllAsync(`
      SELECT * FROM journal_entries ORDER BY date DESC
    `);
    
    console.log('=== EXPORT DEBUG ===');
    console.log('Total entries found:', entries.length);
    if (entries.length > 0) {
      console.log('Entry IDs:', entries.map(e => e.id));
      console.log('Entry titles:', entries.map(e => e.title));
    }
    
    // Get all tags
    const tags = await db.getAllAsync(`
      SELECT * FROM tags ORDER BY name ASC
    `);
    
    console.log('Total tags found:', tags.length);
    
    // Get all entry-tag associations
    const entryTags = await db.getAllAsync(`
      SELECT * FROM entry_tags
    `);
    
    console.log('Total entry-tag associations:', entryTags.length);
    console.log('=== EXPORT DEBUG END ===');
    
    // Parse images JSON for each entry
    const entriesWithParsedImages = entries.map(entry => ({
      ...entry,
      images: entry.images ? JSON.parse(entry.images) : []
    }));
    
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: entriesWithParsedImages,
      tags,
      entryTags
    };
    
    console.log('Exported data:', {
      entries: backup.entries.length,
      tags: backup.tags.length,
      entryTags: backup.entryTags.length
    });
    
    return backup;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// Import data from backup
export const importAllData = async (backup) => {
  try {
    console.log('=== IMPORT START ===');
    console.log('Getting database instance...');
    
    const db = await getDBInstance();
    
    console.log('✓ Database instance obtained');
    console.log('=== BACKUP STRUCTURE DEBUG ===');
    console.log('Received backup:', {
      hasBackup: !!backup,
      backupKeys: backup ? Object.keys(backup) : null,
      backupType: typeof backup,
      isArray: Array.isArray(backup),
    });
    
    if (backup?.entries) {
      console.log('backup.entries:', {
        type: typeof backup.entries,
        isArray: Array.isArray(backup.entries),
        keys: backup.entries && typeof backup.entries === 'object' ? Object.keys(backup.entries) : null,
      });
    }
    
    // Unwrap if the backup has a wrapper structure (entries contains the real data)
    let actualBackup = backup;
    
    // Check if backup.entries is an object containing the real data
    if (backup?.entries && typeof backup.entries === 'object' && !Array.isArray(backup.entries)) {
      const entriesObj = backup.entries;
      // If entries.entries exists and is an array, we have a wrapped structure
      if (Array.isArray(entriesObj.entries) && Array.isArray(entriesObj.tags) && Array.isArray(entriesObj.entryTags)) {
        console.log('✓ Detected wrapped backup structure (entries is an object), unwrapping...');
        actualBackup = entriesObj;
      }
    }
    // Check if backup is already in the correct format
    else if (Array.isArray(backup?.entries) && Array.isArray(backup?.tags) && Array.isArray(backup?.entryTags)) {
      console.log('✓ Backup already in correct format');
      actualBackup = backup;
    }
    
    if (!actualBackup || !actualBackup.entries || !actualBackup.tags || !actualBackup.entryTags) {
      const errorMsg = `Invalid backup - missing required arrays. Has entries: ${!!actualBackup?.entries}, Has tags: ${!!actualBackup?.tags}, Has entryTags: ${!!actualBackup?.entryTags}`;
      console.error(errorMsg);
      throw new Error('Invalid backup format: ' + errorMsg);
    }
    
    console.log('✓ Backup validation passed');
    
    // Merge restore: INSERT OR REPLACE to keep local entries not in backup
    // This way: backup entries override local, but local-only entries are kept
    
    // Import tags (update if exists, insert if new)
    for (const tag of actualBackup.tags) {
      await db.runAsync(
        `INSERT OR REPLACE INTO tags (id, name, createdAt) VALUES (?, ?, ?)`,
        [tag.id, tag.name, tag.createdAt]
      );
    }
    console.log('✓ Tags imported/updated');
    
    // Import journal entries (update if exists, insert if new)
    for (const entry of actualBackup.entries) {
      const imagesJSON = entry.images && entry.images.length > 0 
        ? JSON.stringify(entry.images) 
        : null;
        
      await db.runAsync(
        `INSERT OR REPLACE INTO journal_entries (id, date, title, body, images, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.date, entry.title, entry.body, imagesJSON, entry.createdAt]
      );
    }
    console.log('✓ Journal entries imported/updated');
    
    // Import entry-tag associations (update if exists, insert if new)
    for (const entryTag of actualBackup.entryTags) {
      await db.runAsync(
        `INSERT OR REPLACE INTO entry_tags (id, entryId, tagId) VALUES (?, ?, ?)`,
        [entryTag.id, entryTag.entryId, entryTag.tagId]
      );
    }
    console.log('✓ Entry-tag associations imported/updated');
    
    console.log('✓ Imported data successfully:', {
      entries: actualBackup.entries.length,
      tags: actualBackup.tags.length,
      entryTags: actualBackup.entryTags.length
    });
    console.log('=== IMPORT END ===');
    
    return true;
  } catch (error) {
    console.error('✗ Error importing data:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

// Export a single entry for backup
export const exportSingleEntry = async (entryId) => {
  try {
    const db = await getDBInstance();
    
    // Get the specific journal entry
    const entry = await db.getFirstAsync(`
      SELECT * FROM journal_entries WHERE id = ?
    `, [entryId]);
    
    if (!entry) {
      throw new Error(`Entry with ID ${entryId} not found`);
    }
    
    // Get tags for this entry
    const entryTags = await db.getAllAsync(`
      SELECT * FROM entry_tags WHERE entryId = ?
    `, [entryId]);
    
    // Get the tag details
    const tagIds = entryTags.map(et => et.tagId);
    let tags = [];
    if (tagIds.length > 0) {
      const placeholders = tagIds.map(() => '?').join(',');
      tags = await db.getAllAsync(`
        SELECT * FROM tags WHERE id IN (${placeholders})
      `, tagIds);
    }
    
    // Parse images
    const entryWithImages = {
      ...entry,
      images: entry.images ? JSON.parse(entry.images) : []
    };
    
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: [entryWithImages],
      tags,
      entryTags
    };
    
    console.log(`Exported single entry ${entryId}:`, {
      entries: 1,
      tags: tags.length,
      entryTags: entryTags.length
    });
    
    return backup;
  } catch (error) {
    console.error('Error exporting single entry:', error);
    throw error;
  }
};

// =============FOR TESTING PURPOSES ONLY
const clearDataBase = async () => {
  const db = await getDBInstance();
  await db.runAsync(`DELETE FROM journal_entries`);
};

//clearDataBase();


