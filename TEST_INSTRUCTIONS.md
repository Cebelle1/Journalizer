# Testing Pagination - Quick Guide

## Step 1: Create 300 Test Entries

Put this in App.js (or another file that always loads):

```javascript
import * as testGen from './src/utils/testDataGenerator';
if (typeof global !== 'undefined') {
  global.testGen = testGen;
}
```

Open debugger console and run:
```javascript
testGen.createTestEntries();
testGen.deleteOnlyTestEntries();
testGen.deleteAllTestEntries();
```

Or add this temporarily to your app (e.g., in a button):

```javascript
import { createTestEntries } from '../utils/testDataGenerator';

// In your component
<TouchableOpacity onPress={async () => {
  await createTestEntries();
  loadEntries(true);
}}>
  <Text>CREATE 300 ENTRIES</Text>
</TouchableOpacity>
```

## Step 2: Test Pagination

1. Open the JournalScreen
2. You should see only ~30 entries initially
3. Scroll to the bottom
4. Watch for loading spinner
5. More entries should load automatically
6. Keep scrolling to load all 300

## Step 3: Delete All Test Entries

**Option A: Delete ONLY test entries (safer - keeps your real entries):**

```javascript
import { deleteOnlyTestEntries } from './src/utils/testDataGenerator';
await deleteOnlyTestEntries();
```

**Option B: Delete ALL entries (WARNING: Deletes everything!):**

```javascript
import { deleteAllTestEntries } from './src/utils/testDataGenerator';
await deleteAllTestEntries();
```

## Quick Copy-Paste Commands

**Create entries:**
```javascript
import { createTestEntries } from './src/utils/testDataGenerator'; await createTestEntries();
```

**Delete test entries only:**
```javascript
import { deleteOnlyTestEntries } from './src/utils/testDataGenerator'; await deleteOnlyTestEntries();
```

**Delete ALL entries:**
```javascript
import { deleteAllTestEntries } from './src/utils/testDataGenerator'; await deleteAllTestEntries();
```

## Verify Pagination is Working

You should see in the console:
- Initial load: "Loading page 0, offset 0"
- On scroll: "Loading page 1, offset 30", "Loading page 2, offset 60", etc.
- Loading spinner appears at bottom of list
- Smooth performance even with 300 entries
