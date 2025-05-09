// steamNewsChecker.js

const axios = require('axios');
const path = require('path');
const fileUtils = require('../utils/fileUtils');
const { getTrackedGames } = require('./trackedAppCommands');

// Configuration
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const TRACKING_FILE = path.join(__dirname, '../data/tracked_news_ids.txt');
const TARGET_CHANNEL_ID = '1370455264964251741'; // #game-updates

/**
 * Fetch news for a specific app
 * @param {string} appId - Steam app ID
 * @param {string} gameName - Game name for display
 * @param {Array} trackedIds - Already tracked news IDs
 * @returns {Promise<Object>} Results of the news check
 */
async function fetchNewsForApp(appId, gameName, trackedIds) {
  try {
    console.log(`Checking for news updates for ${gameName} (${appId})...`);
    
    const steamApiUrl = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?key=${STEAM_API_KEY}&appid=${appId}&count=5`;
    
    console.log(`Fetching news from: ${steamApiUrl.replace(STEAM_API_KEY, 'REDACTED')}`);
    
    const response = await axios.get(steamApiUrl);
    
    if (!response.data || !response.data.appnews || !response.data.appnews.newsitems) {
      console.log(`No news items found or unexpected API response format for ${gameName}`);
      return { 
        success: false, 
        newNewsItems: [],
        gameName,
        appId,
        error: 'Unexpected API response format'
      };
    }
    
    const newsItems = response.data.appnews.newsitems;
    
    //filter out items that dont have feed_type = 1
    const relevantNewsItems = newsItems.filter((i) => {
        return i.feed_type == 1
    });

    console.log(`Retrieved ${relevantNewsItems.length} relevant news items from Steam API for ${gameName}`);
    
    const newNewsItems = relevantNewsItems.filter(item => !trackedIds.includes(item.gid));
    
    console.log(`Found ${newNewsItems.length} new news items to announce for ${gameName}`);
    
    return { 
      success: true, 
      newNewsItems,
      gameName,
      appName: response.data.appnews.appname || gameName,
      appId
    };
  } catch (error) {
    console.error(`Error checking Steam news for ${gameName} (${appId}):`, error);
    return { 
      success: false, 
      newNewsItems: [],
      gameName,
      appId,
      error: error.message
    };
  }
}

/**
 * Main function to check for new Steam news updates for all tracked games
 * @param {Object} client - Discord.js client instance
 * @param {Object} [messageToReply] - Optional message object to reply to
 */
async function checkSteamNews(client, messageToReply = null) {
  try {
    console.log('Checking for new Steam news updates for all tracked games...');
    
    // Get all tracked games
    const games = await getTrackedGames();
    
    if (games.length === 0) {
      console.log('No games are currently being tracked.');
      
      if (messageToReply) {
        messageToReply.reply("There are no games currently being tracked, sir. Use !addTrackedGame to add a game to monitor.");
      }
      
      return;
    }
    
    // Read tracked IDs using our fileUtils module
    const trackedIds = await fileUtils.readTrackedIds(TRACKING_FILE);
    
    // Check news for each game
    const results = [];
    const newIdsToTrack = [];
    let totalNewItems = 0;
    
    for (const game of games) {
      const result = await fetchNewsForApp(game.app_id, game.name, trackedIds);
      results.push(result);
      
      if (result.success && result.newNewsItems.length > 0) {
        totalNewItems += result.newNewsItems.length;
        
        // Add new IDs to tracking list
        const idsToAdd = result.newNewsItems.map(item => item.gid);
        newIdsToTrack.push(...idsToAdd);
        
        // Get the target channel
        const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
        
        if (targetChannel) {
          for (const item of result.newNewsItems) {
            // Send a simple message with the URL - Discord will auto-embed it nicely
            await targetChannel.send(
              `📢 **New update for ${result.appName}!**\n${item.url}`
            );
            
            console.log(`Sent announcement for news item: ${item.gid} (${result.gameName})`);
          }
        } else {
          console.error(`Could not find target channel with ID: ${TARGET_CHANNEL_ID}`);
        }
      }
    }
    
    // Update tracking file with all new IDs
    if (newIdsToTrack.length > 0) {
      await fileUtils.updateTrackedIds(TRACKING_FILE, newIdsToTrack, 100); // Increased max to 100 for multiple games
    }
    
    // If this was manually triggered, reply to the message
    if (messageToReply) {
      if (totalNewItems > 0) {
        const gamesWithUpdates = results
          .filter(r => r.success && r.newNewsItems.length > 0)
          .map(r => `${r.gameName} (${r.newNewsItems.length})`)
          .join(', ');
          
        messageToReply.reply(
          `I've found ${totalNewItems} new game updates across ${gamesWithUpdates}, sir. I've posted them in the #game-updates channel.`
        );
      } else {
        messageToReply.reply(`I've checked for updates for all ${games.length} tracked games, sir. No new announcements were found.`);
      }
    }
    
    console.log('Steam news check completed for all games');
  } catch (error) {
    console.error('Error checking Steam news:', error);
    
    // If this was manually triggered, reply with error
    if (messageToReply) {
      messageToReply.reply("I do apologize, sir. I encountered an error while checking for Steam news.");
    }
  }
}

/**
 * Initialize the Steam news checker
 * @param {Object} client - Discord.js client instance
 */
function initSteamNewsChecker(client) {
  console.log('Initializing Steam news checker...');
  
  // Run once on startup
  checkSteamNews(client);
  
  // Then set interval for recurring checks
  setInterval(() => checkSteamNews(client), CHECK_INTERVAL_MS);
  
  console.log(`Steam news checker will run every ${CHECK_INTERVAL_MS / 1000 / 60} minutes`);
}

module.exports = {
  initSteamNewsChecker,
  checkSteamNews  // Export the function so we can call it directly
};