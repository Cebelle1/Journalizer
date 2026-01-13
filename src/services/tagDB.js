import * as SQLite from 'expo-sqlite';

const createTagDB = async () => {
  const db = await SQLite.openDatabaseAsync('TagDB.db');

  // Initialize the database with a journal entries table
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tags (
      tag TEXT PRIMARY KEY,
    );
  `);

  console.log('Tags database initialized');
  return db;
};