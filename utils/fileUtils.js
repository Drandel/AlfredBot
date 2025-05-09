// fileUtils.js

const fs = require('fs').promises;
const path = require('path');

/**
 * Reads data from a file
 * @param {string} filePath - Path to the file
 * @param {string} [defaultContent=''] - Default content if file doesn't exist
 * @returns {Promise<string>} - File content
 */
async function readFile(filePath, defaultContent = '') {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (err) {
    // If file doesn't exist, create it with default content
    if (err.code === 'ENOENT') {
      console.log(`File does not exist yet: ${filePath}, creating it`);
      await writeFile(filePath, defaultContent);
      return defaultContent;
    }
    // Re-throw other errors
    throw err;
  }
}

/**
 * Writes data to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
async function writeFile(filePath, content) {
  try {
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
    
    // Write the file
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Successfully wrote to file: ${filePath}`);
  } catch (err) {
    console.error(`Error writing to file ${filePath}:`, err);
    throw err;
  }
}

/**
 * Reads ID list from a tracking file
 * @param {string} filePath - Path to the tracking file
 * @returns {Promise<string[]>} - Array of tracked IDs
 */
async function readTrackedIds(filePath) {
  try {
    const fileContent = await readFile(filePath);
    const trackedIds = fileContent.split('\n').filter(id => id.trim() !== '');
    console.log(`Loaded ${trackedIds.length} tracked IDs from file: ${filePath}`);
    return trackedIds;
  } catch (err) {
    console.error(`Error reading tracking file ${filePath}:`, err);
    return [];
  }
}

/**
 * Writes ID list to a tracking file
 * @param {string} filePath - Path to the tracking file
 * @param {string[]} ids - Array of IDs to write
 * @param {number} [maxIds=50] - Maximum number of IDs to keep
 * @returns {Promise<void>}
 */
async function writeTrackedIds(filePath, ids, maxIds = 50) {
  try {
    // Keep only the most recent maxIds to prevent the file from growing indefinitely
    const trimmedIds = ids.slice(-maxIds);
    await fs.writeFile(filePath, trimmedIds.join('\n') + '\n', 'utf8');
    console.log(`Updated tracking file ${filePath} with ${ids.length} IDs (trimmed to ${trimmedIds.length})`);
  } catch (err) {
    console.error(`Error writing to tracking file ${filePath}:`, err);
    throw err;
  }
}

/**
 * Updates tracking file with new IDs
 * @param {string} filePath - Path to the tracking file
 * @param {string[]} newIds - New IDs to add
 * @param {number} [maxIds=50] - Maximum number of IDs to keep
 * @returns {Promise<void>}
 */
async function updateTrackedIds(filePath, newIds, maxIds = 50) {
  const existingIds = await readTrackedIds(filePath);
  const updatedIds = [...existingIds, ...newIds];
  await writeTrackedIds(filePath, updatedIds, maxIds);
}

module.exports = {
  readFile,
  writeFile,
  readTrackedIds,
  writeTrackedIds,
  updateTrackedIds
};