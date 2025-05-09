// trackedAppCommands.js

const path = require('path');
const fileUtils = require('../utils/fileUtils');

// Configuration
const TRACKED_APPS_FILE = path.join(__dirname, '../data/tracked_app_ids.json');

/**
 * Get list of all tracked games
 * @returns {Promise<Array>} Array of game objects
 */
async function getTrackedGames() {
  try {
    const content = await fileUtils.readFile(TRACKED_APPS_FILE, '[]');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading tracked games:', err);
    return [];
  }
}

/**
 * Save tracked games to file
 * @param {Array} games - Array of game objects
 * @returns {Promise<void>}
 */
async function saveTrackedGames(games) {
  try {
    const content = JSON.stringify(games, null, 2);
    await fileUtils.writeFile(TRACKED_APPS_FILE, content);
  } catch (err) {
    console.error('Error saving tracked games:', err);
    throw err;
  }
}

/**
 * Add a new game to tracking list
 * @param {string} name - Game name
 * @param {string} appId - Steam app ID
 * @returns {Promise<Object>} Result of operation
 */
async function addTrackedGame(name, appId) {
  try {
    const games = await getTrackedGames();
    
    // Check if game with this app_id already exists
    const existingIndex = games.findIndex(game => game.app_id === appId);
    
    if (existingIndex >= 0) {
      return { 
        success: false, 
        message: `Game with app ID ${appId} already exists as "${games[existingIndex].name}"` 
      };
    }
    
    // Add new game
    games.push({ name, app_id: appId });
    
    await saveTrackedGames(games);
    
    return { 
      success: true, 
      message: `Successfully added "${name}" (${appId}) to tracked games` 
    };
  } catch (err) {
    console.error('Error adding tracked game:', err);
    return { 
      success: false, 
      message: `Error adding game: ${err.message}` 
    };
  }
}

/**
 * Remove a game from tracking list
 * @param {string} appId - Steam app ID to remove
 * @returns {Promise<Object>} Result of operation
 */
async function removeTrackedGame(appId) {
  try {
    const games = await getTrackedGames();
    
    // Find the game
    const gameIndex = games.findIndex(game => game.app_id === appId);
    
    if (gameIndex < 0) {
      return { 
        success: false, 
        message: `No game found with app ID ${appId}` 
      };
    }
    
    const removedGame = games[gameIndex];
    
    // Remove the game
    games.splice(gameIndex, 1);
    
    await saveTrackedGames(games);
    
    return { 
      success: true, 
      message: `Successfully removed "${removedGame.name}" (${appId}) from tracked games` 
    };
  } catch (err) {
    console.error('Error removing tracked game:', err);
    return { 
      success: false, 
      message: `Error removing game: ${err.message}` 
    };
  }
}

/**
 * Handle Discord commands related to tracked games
 * @param {Object} message - Discord message object
 */
async function handleTrackedAppCommands(message) {
  const content = message.content.trim();
  
  // Command: !trackedGames
  if (content === '!trackedGames') {
    try {
      const games = await getTrackedGames();
      
      if (games.length === 0) {
        message.reply("There are currently no games being tracked, sir.");
        return;
      }
      
      const gamesList = games.map(game => `• ${game.name} (${game.app_id})`).join('\n');
      message.reply(`Here are the currently tracked games, sir:\n${gamesList}`);
    } catch (err) {
      console.error('Error handling !trackedGames command:', err);
      message.reply("I do apologize, sir. I encountered an error fetching the tracked games list.");
    }
    return;
  }
  
  // Command: !addTrackedGame
  if (content === '!addTrackedGame') {
    const filter = m => m.author.id === message.author.id;
    
    message.reply("Please provide the game name and Steam app ID separated by a comma (e.g., Rematch,2138720)");
    
    try {
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
      const response = collected.first().content;
      
      // Parse input (name,appId)
      const [name, appId] = response.split(',').map(part => part.trim());
      
      if (!name || !appId) {
        message.reply("Invalid format. Please use: Game Name,AppID");
        return;
      }
      
      const result = await addTrackedGame(name, appId);
      message.reply(result.message);
    } catch (err) {
      if (err.message === 'time') {
        message.reply("The operation timed out, sir. Please try again.");
      } else {
        console.error('Error handling !addTrackedGame command:', err);
        message.reply("I do apologize, sir. I encountered an error adding the game.");
      }
    }
    return;
  }
  
  // Command: !removeTrackedGame
  if (content === '!removeTrackedGame') {
    const filter = m => m.author.id === message.author.id;
    
    message.reply("Please provide the Steam app ID of the game you wish to remove.");
    
    try {
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
      const appId = collected.first().content.trim();
      
      const result = await removeTrackedGame(appId);
      message.reply(result.message);
    } catch (err) {
      if (err.message === 'time') {
        message.reply("The operation timed out, sir. Please try again.");
      } else {
        console.error('Error handling !removeTrackedGame command:', err);
        message.reply("I do apologize, sir. I encountered an error removing the game.");
      }
    }
    return;
  }
}

module.exports = {
  handleTrackedAppCommands,
  getTrackedGames,
  addTrackedGame,
  removeTrackedGame
};