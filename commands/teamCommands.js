// teamCommands.js
const createRandomTeams = (players) => {
  // Shuffle the array of players
  const shuffledPlayers = [...players];
  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlayers[i], shuffledPlayers[j]] = [
      shuffledPlayers[j],
      shuffledPlayers[i],
    ];
  }

  // Split into two teams
  const halfLength = Math.floor(shuffledPlayers.length / 2);
  const team1 = shuffledPlayers.slice(
    0,
    halfLength + (shuffledPlayers.length % 2)
  );
  const team2 = shuffledPlayers.slice(
    halfLength + (shuffledPlayers.length % 2)
  );

  return { team1, team2 };
};

const formatTeamsTable = (team1, team2) => {
  const allPlayers = [...team1, ...team2];
  // Find the max length for formatting
  const maxLength = Math.max(...allPlayers.map((name) => name.length)) + 5;

  // Create the ASCII table header
  let table = `Team 1${" ".repeat(maxLength - 5)}|${" ".repeat(10)}Team 2\n`;
  table += `${"-".repeat(maxLength)}+${"-".repeat(maxLength)}\n`;

  // Fill in the table with team members
  const maxRows = Math.max(team1.length, team2.length);
  for (let i = 0; i < maxRows; i++) {
    const team1Member = team1[i] || "";
    const team2Member = team2[i] || "";
    table += `${team1Member}${" ".repeat(
      maxLength - team1Member.length
    )}|${" ".repeat(10)}${team2Member}\n`;
  }

  return table;
};

const handleVoiceChannelTeamCreation = (message) => {
  // Check if the user is in a voice channel
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    return message.reply(
      "It appears you are not in a voice channel, sir. I'm afraid I cannot assist with team creation unless you join one."
    );
  }

  // Get all members in the voice channel
  const players = voiceChannel.members
    .filter((member) => !member.user.bot)
    .map((member) => member.displayName);

  // If no players found
  if (players.length <= 1) {
    return message.reply(
      "I do apologize, sir, but I require at least two participants in the voice channel to create balanced teams."
    );
  }

  // Generate the teams
  const { team1, team2 } = createRandomTeams(players);

  // Format and send the table
  const table = formatTeamsTable(team1, team2);
  message.channel.send(
    `I've taken the liberty of organizing the participants from ${voiceChannel.name} into teams, sir:`
  );
  message.channel.send("```\n" + table + "```");
};

const handleManualTeamCreation = (message) => {
  // Ask for player names
  message.reply(
    "Very good, sir. Please provide the names of the participants, separated by commas, if you would be so kind."
  );

  // Create a filter to only collect messages from the original author
  const filter = (m) => m.author.id === message.author.id;

  // Wait for the response
  const collector = message.channel.createMessageCollector({
    filter,
    time: 60000,
    max: 1,
  });

  collector.on("collect", (collected) => {
    // Get player names, split by comma and trim whitespace
    const players = collected.content.split(",").map((name) => name.trim());

    if (players.length <= 1) {
      return message.reply(
        "I'm afraid I need at least two names to create teams, sir."
      );
    }

    // Generate the teams
    const { team1, team2 } = createRandomTeams(players);

    // Format and send the table
    const table = formatTeamsTable(team1, team2);
    message.channel.send("I've prepared the teams as requested, sir:");
    message.channel.send("```\n" + table + "```");
  });

  collector.on("end", (collected) => {
    if (collected.size === 0) {
      message.reply(
        "I notice you haven't provided any names within the time limit, sir. Do let me know if you wish to try again."
      );
    }
  });
};

const initiateTeamCreation = (message) => {
  // Check if user is in voice channel first
  const isInVoiceChannel = message.member.voice.channel !== null;

  if (isInVoiceChannel) {
    // Ask if they want to use voice channel members
    message.reply(
      "I notice you're in a voice channel, sir. Would you like me to create teams using the participants in your current voice channel? Please respond with 'yes' or 'no'."
    );

    // Create a filter to only collect messages from the original author
    const filter = (m) =>
      m.author.id === message.author.id &&
      (m.content.toLowerCase().includes("yes") ||
        m.content.toLowerCase().includes("no"));

    // Wait for the response
    const collector = message.channel.createMessageCollector({
      filter,
      time: 30000,
      max: 1,
    });

    collector.on("collect", (collected) => {
      const response = collected.content.toLowerCase();

      if (response.includes("yes")) {
        handleVoiceChannelTeamCreation(message);
      } else {
        handleManualTeamCreation(message);
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        message.reply(
          "I didn't receive a clear response, sir. Please use the command again when you're ready."
        );
      }
    });
  } else {
    // If not in voice channel, go straight to manual team creation
    handleManualTeamCreation(message);
  }
};

module.exports = {
  initiateTeamCreation,
};
