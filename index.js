// index.js

require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const { initiateTeamCreation } = require("./commands/teamCommands");

const { initSteamNewsChecker, checkSteamNews } = require("./commands/steamNewsCommands")

const { handleTrackedAppCommands } = require('./commands/trackedAppCommands');

// Create a new client instance with ALL needed intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, // Added for voice channel functionality
  ],
});

// Helper function for the help command
function getHelpMessage() {
  return {
    content: "Here are all available commands, sir:",
    embeds: [{
      title: "Alfred's Command List",
      color: 0x0099ff, // Blue color
      thumbnail: {
        url: client.user.displayAvatarURL(),
      },
      fields: [
        {
          name: "🎮 Game Tracking",
          value: 
            "• `!gameUpdates` - Check for new updates for all tracked games\n" +
            "• `!trackedGames` - Display all currently tracked games\n" +
            "• `!addTrackedGame` - Add a new game to track\n" +
            "• `!removeTrackedGame` - Remove a game from tracking",
        },
        {
          name: "👥 Team Management",
          value: "• `!randomTeams` - Create random teams from users in a voice channel",
        },
        {
          name: "🎲 Fun Commands",
          value: 
            "• `!ping` - Check if I'm online\n" +
            "• `!random` - Generate a random number between 1-100\n" +
            "• `!8ball [question]` - Ask the Magic 8-Ball a question",
        },
        {
          name: "ℹ️ Help",
          value: "• `!help` - Display this help message",
        }
      ],
      footer: {
        text: "I automatically check for game updates every hour and post them in the #game-updates channel.",
      },
      timestamp: new Date(),
    }]
  };
}

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  initSteamNewsChecker(client);
  console.log('Started Steam News Checker')
});

// Listen for messages
client.on("messageCreate", async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Help command
  if (message.content === "!help") {
    message.reply(getHelpMessage());
    return;
  }

  // Simple ping command
  if (message.content === "!ping") {
    message.reply("Pong!");
  }

  // Random number generator
  if (message.content === "!random") {
    const randomNum = Math.floor(Math.random() * 100) + 1;
    message.reply(`Your random number is: ${randomNum}`);
  }

  // 8-Ball command
  if (message.content.startsWith("!8ball")) {
    // Array of possible responses
    const responses = [
      "It is certain.",
      "Without a doubt.",
      "Yes definitely.",
      "You may rely on it.",
      "As I see it, yes.",
      "Most likely.",
      "Outlook good.",
      "Signs point to yes.",
      "Reply hazy, try again.",
      "Ask again later.",
      "Better not tell you now.",
      "Cannot predict now.",
      "Concentrate and ask again.",
      "Don't count on it.",
      "My reply is no.",
      "My sources say no.",
      "Outlook not so good.",
      "Very doubtful.",
    ];

    // Get a random response from the array
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    // Optional: Get the question asked (everything after "!8ball ")
    const question = message.content.slice(7).trim();

    // Reply with the question and answer for context
    if (question) {
      message.reply(`Question: "${question}"\nAlfred says: ${randomResponse}`);
    } else {
      message.reply(`Alfred says: ${randomResponse}`);
    }
  }

  // Unified team creation command
  if (message.content === "!randomTeams") {
    initiateTeamCreation(message);
  }

  // Manual game updates check command
  if (message.content === "!gameUpdates") {
    // await message.reply("Checking for game updates, sir. One moment please...");
    checkSteamNews(client, message);
  }

  // Game tracking commands
  if (['!trackedGames', '!addTrackedGame', '!removeTrackedGame'].includes(message.content)) {
    await handleTrackedAppCommands(message);
    return;
  }
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);