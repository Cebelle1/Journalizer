import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';

const IMAGES_DIR = `${FileSystem.documentDirectory}JournalImages/`;

// Helper to format color with # prefix
const formatColor = (color) => {
  if (!color) return '#8E44AD';
  const str = String(color).trim();
  return str.startsWith('#') ? str : `#${str}`;
};

const ensureImagesDir = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('✗ Error ensuring images directory:', error);
  }
};

const readImageAsBase64 = async (uri) => {
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (error) {
    try {
      const extensionMatch = uri?.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i);
      const ext = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
      const tempPath = `${FileSystem.cacheDirectory}backup_${Date.now()}.${ext}`;
      await FileSystem.copyAsync({ from: uri, to: tempPath });
      return await FileSystem.readAsStringAsync(tempPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (copyError) {
      console.error('✗ Error reading image as base64:', copyError);
      return null;
    }
  }
};

const serializeImagesForBackup = async (images = []) => {
  if (!Array.isArray(images) || images.length === 0) return [];

  const serialized = [];
  for (const uri of images) {
    try {
      if (typeof uri !== 'string') {
        serialized.push(uri);
        continue;
      }

      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        serialized.push(uri);
        continue;
      }

      const base64 = await readImageAsBase64(uri);
      if (!base64) {
        serialized.push(uri);
        continue;
      }

      const extensionMatch = uri.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i);
      const ext = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';

      serialized.push({
        uri,
        base64,
        ext,
      });
    } catch (error) {
      console.error('✗ Error serializing image:', error);
      serialized.push(uri);
    }
  }

  return serialized;
};

const restoreImagesFromBackup = async (images = [], entryId = 'entry') => {
  if (!Array.isArray(images) || images.length === 0) return [];

  await ensureImagesDir();

  const restored = [];
  let index = 0;

  for (const img of images) {
    try {
      if (typeof img === 'string') {
        restored.push(img);
        index += 1;
        continue;
      }

      if (img && img.base64) {
        const extension = img.ext || 'jpg';
        const fileName = `${entryId}_${index}_${Date.now()}.${extension}`;
        const filePath = `${IMAGES_DIR}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, img.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        restored.push(filePath);
        index += 1;
        continue;
      }

      if (img?.uri) {
        restored.push(img.uri);
        index += 1;
        continue;
      }
    } catch (error) {
      console.error('✗ Error restoring image:', error);
    }

    index += 1;
  }

  return restored;
};

const createJournalDB = async () => {
  try {
    const db = await SQLite.openDatabaseAsync('JournalDB.db');
    return db;
  } catch (error) {
    console.error('✗ Error opening database:', error);
    
    try {
      // Try to delete the corrupted database file
      const dbPath = `${FileSystem.documentDirectory}SQLite/JournalDB.db`;
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      
      // Try opening again
      const db = await SQLite.openDatabaseAsync('JournalDB.db');
      return db;
    } catch (resetError) {
      console.error('✗ Failed to reset database:', resetError);
      throw error;
    }
  }
};

// Run migrations
const runMigrations = async (db) => {
  try {
    // Check if color column exists in tags table
    const tableInfo = await db.getAllAsync("PRAGMA table_info(tags)");
    const hasColorColumn = tableInfo.some(col => col.name === 'color');
    
    if (!hasColorColumn) {
      console.log('Adding color column to tags table...');
      await db.runAsync(`ALTER TABLE tags ADD COLUMN color TEXT DEFAULT '8E44AD'`);
      console.log('✓ Successfully added color column to tags table');
    }

    // Check if images column exists in journal_entries table
    const entriesTableInfo = await db.getAllAsync("PRAGMA table_info(journal_entries)");
    const hasImagesColumn = entriesTableInfo.some(col => col.name === 'images');
    
    if (!hasImagesColumn) {
      console.log('Adding images column to journal_entries table...');
      await db.runAsync(`ALTER TABLE journal_entries ADD COLUMN images TEXT`);
      console.log('✓ Successfully added images column to journal_entries table');
    }
  } catch (error) {
    console.error('✗ Error running migrations:', error);
    // Don't throw - migrations are not critical
  }
};

// Initialize tables on first use
const initializeTables = async (db) => {
  try {
    try {
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          color TEXT DEFAULT '8E44AD',
          createdAt TEXT NOT NULL
        )
      `);
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
    } catch (err) {
      console.error('Error creating entry_tags table:', err);
      throw err;
    }

    // Run migrations
    await runMigrations(db);
  } catch (error) {
    console.error('✗ Error initializing tables:', error);
    
    try {
      // Close any open connections
      if (db) {
        try {
          await db.closeAsync?.();
        } catch (e) {
          // ignore
        }
      }
      
      // Reset the instance
      dbInstance = null;
      initializingPromise = null;
      
      // Delete corrupted database
      const dbPath = `${FileSystem.documentDirectory}SQLite/JournalDB.db`;
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      
      // Retry
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
    initializingPromise = (async () => {
      const db = await createJournalDB();
      const result = await initializeTables(db);
      // initializeTables might return a new db instance if recovery happened
      const finalDb = result || db;
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
        `INSERT OR IGNORE INTO tags (name, color, createdAt) VALUES (?, ?, ?)`,
        [tagName, '#8E44AD', now]
      );
      
      const tag = await db.getFirstAsync(`SELECT id FROM tags WHERE name = ?`, [tagName]);
      if (tag) {
        await db.runAsync(
          `INSERT OR IGNORE INTO entry_tags (entryId, tagId) VALUES (?, ?)`,
          [entryId, tag.id]
        );
      }
    }
    
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
        je.createdAt
      FROM journal_entries je
      ORDER BY je.date DESC
    `, []);
    
    // Fetch tags for each entry
    const entriesWithTags = [];
    for (const entry of entries) {
      const tagResults = await db.getAllAsync(`
        SELECT DISTINCT t.id, t.name, t.color
        FROM entry_tags et
        LEFT JOIN tags t ON et.tagId = t.id
        WHERE et.entryId = ?
        ORDER BY t.name ASC
      `, [entry.id]);
      
      const tags = tagResults ? tagResults.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: formatColor(tag.color)
      })) : [];
      
      entriesWithTags.push({
        ...entry,
        tags
      });
    }
    
    return entriesWithTags;
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
      SELECT DISTINCT je.id, je.date, je.title, je.body, je.createdAt
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
      // Find entries that have ANY of the specified tags (search by tag name)
      const tagNames = tags.filter(t => typeof t === 'string');
      if (tagNames.length > 0) {
        const tagPlaceholders = tagNames.map(() => '?').join(',');
        query += ` AND t.name IN (${tagPlaceholders})`;
        params.push(...tagNames);
      }
    }
    
    query += ` GROUP BY je.id ORDER BY je.date DESC`;
    
    console.log('Executing search query with params:', { query: query.substring(0, 100), paramsCount: params.length });
    const results = await db.getAllAsync(query, params.length > 0 ? params : []);
    
    // Fetch tags for each result
    const resultsWithTags = [];
    for (const entry of results) {
      const tagResults = await db.getAllAsync(`
        SELECT DISTINCT t.id, t.name, t.color
        FROM entry_tags et
        LEFT JOIN tags t ON et.tagId = t.id
        WHERE et.entryId = ?
        ORDER BY t.name ASC
      `, [entry.id]);
      
      const entryTags = tagResults ? tagResults.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: formatColor(tag.color)
      })) : [];
      
      resultsWithTags.push({
        ...entry,
        tags: entryTags
      });
    }
    
    return resultsWithTags;
  } catch (error) {
    console.error('Error searching journal entries:', error);
    return [];
  }
};

// Read journal entries with pagination
export const readJournalEntriesPaginated = async (limit = 30, offset = 0) => {
  try {
    const db = await getDBInstance();
    const entries = await db.getAllAsync(`
      SELECT 
        je.id,
        je.date,
        je.title,
        je.body,
        je.createdAt
      FROM journal_entries je
      ORDER BY je.date DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    // Fetch tags for each entry
    const entriesWithTags = [];
    for (const entry of entries) {
      const tagResults = await db.getAllAsync(`
        SELECT DISTINCT t.id, t.name, t.color
        FROM entry_tags et
        LEFT JOIN tags t ON et.tagId = t.id
        WHERE et.entryId = ?
        ORDER BY t.name ASC
      `, [entry.id]);
      
      const tags = tagResults ? tagResults.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: formatColor(tag.color)
      })) : [];
      
      entriesWithTags.push({
        ...entry,
        tags
      });
    }
    
    return entriesWithTags;
  } catch (error) {
    console.error('Error reading paginated journal entries:', error);
    return [];
  }
};

// Search journal entries with pagination
export const searchJournalEntriesPaginated = async ({startDate, endDate, title, tags = [], limit = 30, offset = 0}) => {
  try {
    const db = await getDBInstance();
    
    let query = `
      SELECT DISTINCT je.id, je.date, je.title, je.body, je.createdAt
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
      const tagNames = tags.filter(t => typeof t === 'string');
      if (tagNames.length > 0) {
        const tagPlaceholders = tagNames.map(() => '?').join(',');
        query += ` AND t.name IN (${tagPlaceholders})`;
        params.push(...tagNames);
      }
    }
    
    query += ` GROUP BY je.id ORDER BY je.date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const results = await db.getAllAsync(query, params.length > 0 ? params : []);
    
    // Fetch tags for each result
    const resultsWithTags = [];
    for (const entry of results) {
      const tagResults = await db.getAllAsync(`
        SELECT DISTINCT t.id, t.name, t.color
        FROM entry_tags et
        LEFT JOIN tags t ON et.tagId = t.id
        WHERE et.entryId = ?
        ORDER BY t.name ASC
      `, [entry.id]);
      
      const entryTags = tagResults ? tagResults.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: formatColor(tag.color)
      })) : [];
      
      resultsWithTags.push({
        ...entry,
        tags: entryTags
      });
    }
    
    return resultsWithTags;
  } catch (error) {
    console.error('Error searching paginated journal entries:', error);
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
    const result = await db.getFirstAsync(`
      SELECT 
        je.id,
        je.date,
        je.title,
        je.body,
        je.images,
        je.createdAt
      FROM journal_entries je
      WHERE je.id = ?
    `, [id]);
    
    if (!result) return null;
    
    // Get tags with colors
    const tagResults = await db.getAllAsync(`
      SELECT DISTINCT t.id, t.name, t.color
      FROM entry_tags et
      LEFT JOIN tags t ON et.tagId = t.id
      WHERE et.entryId = ?
      ORDER BY t.name ASC
    `, [id]);
    
    const tags = tagResults ? tagResults.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: formatColor(tag.color)
    })) : [];
    
    return {
      ...result,
      tags,
      images: result.images ? JSON.parse(result.images) : []
    };
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
        `INSERT OR IGNORE INTO tags (name, color, createdAt) VALUES (?, ?, ?)`,
        [tagName, '#8E44AD', now]
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
    const result = await db.getAllAsync(`SELECT id, name, color FROM tags ORDER BY name ASC`);
    return result ? result.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: formatColor(tag.color)
    })) : [];
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
    
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

// Create a new tag
export const createTag = async (tagName, color = '#8E44AD') => {
  try {
    const db = await getDBInstance();
    const now = new Date().toISOString();
    
    // Strip # from color before storing in database
    const colorValue = color.startsWith('#') ? color.substring(1) : color;
    
    const result = await db.runAsync(
      `INSERT INTO tags (name, color, createdAt) VALUES (?, ?, ?)`,
      [tagName, colorValue, now]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.log('Tag already exists:', tagName);
    return null;
  }
};

// Update tag color
export const updateTagColor = async (tagName, color) => {
  try {
    const db = await getDBInstance();
    // Strip # from color before storing in database
    const colorValue = color.startsWith('#') ? color.substring(1) : color;
    await db.runAsync(
      `UPDATE tags SET color = ? WHERE name = ?`,
      [colorValue, tagName]
    );
  } catch (error) {
    console.error('Error updating tag color:', error);
    throw error;
  }
};

// Rename a tag
export const renameTag = async (oldName, newName) => {
  try {
    const db = await getDBInstance();
    
    // Check if new name already exists
    const existingTag = await db.getFirstAsync(
      `SELECT id FROM tags WHERE name = ?`,
      [newName]
    );
    
    if (existingTag) {
      throw new Error('A tag with this name already exists');
    }
    
    // Update the tag name
    await db.runAsync(
      `UPDATE tags SET name = ? WHERE name = ?`,
      [newName, oldName]
    );
  } catch (error) {
    console.error('Error renaming tag:', error);
    throw error;
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
    
    // Get all tags
    const tags = await db.getAllAsync(`
      SELECT * FROM tags ORDER BY name ASC
    `);
    
    // Get all entry-tag associations
    const entryTags = await db.getAllAsync(`
      SELECT * FROM entry_tags
    `);
    
    // Parse images JSON for each entry
    const entriesWithParsedImages = [];
    for (const entry of entries) {
      const parsedImages = entry.images ? JSON.parse(entry.images) : [];
      const serializedImages = await serializeImagesForBackup(parsedImages);
      entriesWithParsedImages.push({
        ...entry,
        images: serializedImages,
      });
    }
    
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: entriesWithParsedImages,
      tags,
      entryTags
    };
    
    return backup;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// Import data from backup
export const importAllData = async (backup) => {
  try {
    const db = await getDBInstance();
    
    // Unwrap if the backup has a wrapper structure (entries contains the real data)
    let actualBackup = backup;
    
    // Check if backup.entries is an object containing the real data
    if (backup?.entries && typeof backup.entries === 'object' && !Array.isArray(backup.entries)) {
      const entriesObj = backup.entries;
      // If entries.entries exists and is an array, we have a wrapped structure
      if (Array.isArray(entriesObj.entries) && Array.isArray(entriesObj.tags) && Array.isArray(entriesObj.entryTags)) {
        actualBackup = entriesObj;
      }
    }
    // Check if backup is already in the correct format
    else if (Array.isArray(backup?.entries) && Array.isArray(backup?.tags) && Array.isArray(backup?.entryTags)) {
      actualBackup = backup;
    }
    
    if (!actualBackup || !actualBackup.entries || !actualBackup.tags || !actualBackup.entryTags) {
      const errorMsg = `Invalid backup - missing required arrays. Has entries: ${!!actualBackup?.entries}, Has tags: ${!!actualBackup?.tags}, Has entryTags: ${!!actualBackup?.entryTags}`;
      console.error(errorMsg);
      throw new Error('Invalid backup format: ' + errorMsg);
    }
    
    
    // Merge restore: INSERT OR REPLACE to keep local entries not in backup
    // This way: backup entries override local, but local-only entries are kept
    
    // Import tags (update if exists, insert if new)
    for (const tag of actualBackup.tags) {
      await db.runAsync(
        `INSERT OR REPLACE INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)`,
        [tag.id, tag.name, tag.color || '8E44AD', tag.createdAt]
      );
    }
    
    // Import journal entries (update if exists, insert if new)
    for (const entry of actualBackup.entries) {
      const restoredImages = await restoreImagesFromBackup(entry.images || [], entry.id || 'entry');
      const imagesJSON = restoredImages && restoredImages.length > 0 
        ? JSON.stringify(restoredImages) 
        : null;
        
      await db.runAsync(
        `INSERT OR REPLACE INTO journal_entries (id, date, title, body, images, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.date, entry.title, entry.body, imagesJSON, entry.createdAt]
      );
    }
    
    // Import entry-tag associations (update if exists, insert if new)
    for (const entryTag of actualBackup.entryTags) {
      await db.runAsync(
        `INSERT OR REPLACE INTO entry_tags (id, entryId, tagId) VALUES (?, ?, ?)`,
        [entryTag.id, entryTag.entryId, entryTag.tagId]
      );
    }
    
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

    const serializedImages = await serializeImagesForBackup(entryWithImages.images);
    
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: [{
        ...entryWithImages,
        images: serializedImages,
      }],
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


