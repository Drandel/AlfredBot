// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { initiateTeamCreation } = require("./commands/teamCommands");
const { initSteamNewsChecker, checkSteamNews } = require("./commands/steamNewsCommand")

// Create a new client instance with ALL needed intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, // Added for voice channel functionality
  ],
});

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
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);
