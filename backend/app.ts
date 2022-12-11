import { Client, Intents } from 'discord.js';
import { CommandManager } from './src/core/commands/commandManager';
import { JoinVocalCommand } from './src/commands/joinVocal';
import { LeaveVocalCommand } from './src/commands/leaveVocal';
import { AudioTransmitter } from './src/services/audioTransmitter';

const audioTransmitter = new AudioTransmitter();
const client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_VOICE_STATES,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_MEMBERS,
] });

const commandManager = new CommandManager(client);

// When the client is ready, run this code (only once)
client.once('ready', async () => {
	await audioTransmitter.init();
	await commandManager.init();
	
	commandManager.addCommand(new JoinVocalCommand(audioTransmitter));
	commandManager.addCommand(new LeaveVocalCommand());
	await commandManager.registerCommands();
	console.log('Ready!');
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
