// steamNewsChecker.js

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const APP_ID = '2138720'; // Your target game's AppID
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const TRACKING_FILE = path.join(__dirname, 'tracked_news_ids.txt');
const TARGET_CHANNEL_ID = '1370455264964251741'; // #game-updates

/**
 * Main function to check for new Steam news updates
 * @param {Object} client - Discord.js client instance
 * @param {Object} [messageToReply] - Optional message object to reply to
 */
async function checkSteamNews(client, messageToReply = null) {
  try {
    console.log('Checking for new Steam news updates...');
    
    // 1. Call Steam API
    const steamApiUrl = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?key=${STEAM_API_KEY}&appid=${APP_ID}&count=5`;
    
    console.log(`Fetching news from: ${steamApiUrl.replace(STEAM_API_KEY, 'REDACTED')}`);
    
    const response = await axios.get(steamApiUrl);
    
    if (!response.data || !response.data.appnews || !response.data.appnews.newsitems) {
      console.log('No news items found or unexpected API response format');
      
      if (messageToReply) {
        messageToReply.reply("I've checked for updates, sir, but the Steam API returned an unexpected response.");
      }
      
      return;
    }
    
    const newsItems = response.data.appnews.newsitems;
    
    //filter out items that dont have feed_type = 1
    const relevantNewsItems = newsItems.filter((i) => {
        return i.feed_type == 1
    })

    console.log(`Retrieved ${relevantNewsItems.length} relevant news items from Steam API`);
    
    let trackedIds = [];
    try {
      // Try to read existing tracking file
      const fileContent = await fs.readFile(TRACKING_FILE, 'utf8');
      trackedIds = fileContent.split('\n').filter(id => id.trim() !== '');
      console.log(`Loaded ${trackedIds.length} tracked IDs from file`);
    } catch (err) {
      // If file doesn't exist or can't be read, create it
      if (err.code === 'ENOENT') {
        console.log('Tracking file does not exist yet, will create it');
        await fs.writeFile(TRACKING_FILE, '', 'utf8');
      } else {
        console.error('Error reading tracking file:', err);
      }
    }

    const newNewsItems = relevantNewsItems.filter(item => !trackedIds.includes(item.gid));
    
    console.log(`Found ${newNewsItems.length} new news items to announce`);

    if (newNewsItems.length > 0) {
      // Get the target channel
      const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
      
      if (targetChannel) {
        for (const item of newNewsItems) {
          // Send a simple message with the URL - Discord will auto-embed it nicely
          await targetChannel.send(
            `📢 **New update for ${response.data.appnews.appname || 'your game'}!**\n${item.url}`
          );
          
          console.log(`Sent announcement for news item: ${item.gid}`);
        }
      } else {
        console.error(`Could not find target channel with ID: ${TARGET_CHANNEL_ID}`);
      }
      
      // 5. Update tracking file with new IDs
      const idsToAdd = newNewsItems.map(item => item.gid);
      const updatedIds = [...trackedIds, ...idsToAdd];
      
      // Keep only the most recent 50 IDs to prevent the file from growing indefinitely
      const trimmedIds = updatedIds.slice(-50);
      
      await fs.writeFile(TRACKING_FILE, trimmedIds.join('\n') + '\n', 'utf8');
      console.log(`Updated tracking file with ${idsToAdd.length} new IDs`);
    }
    
    
    // If this was manually triggered, reply to the message
    if (messageToReply) {
      if (newNewsItems.length > 0) {
        messageToReply.reply(`I've found ${newNewsItems.length} new game updates, sir. I've posted them in the #game-updates channel.`);
      } else {
        messageToReply.reply(`I've checked for updates, sir. No new announcements were found.`);
      }
    }
    
    console.log('Steam news check completed');
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