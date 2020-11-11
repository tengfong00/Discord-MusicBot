const Discord = require('discord.js');
const { token } = require('token.json');
const client = new Discord.Client();
const ytdl = require('ytdl-core');

class Music {
    constructor() {
        this.isPlaying = false;
        this.queue = [];
        this.connection = {};
        this.dispatcher = {};
        this.embed = null;
        this.msg = null;
        this.volume = 0.2;
    }

    async add(message,playlist) {
        // Locate message channel
        this.msg = await message.channel;

        // Insert music info to array
        let i = 0;
        for (i; i <= playlist.length-1; i++) {
            let info = await ytdl.getBasicInfo(playlist[i]);
            this.queue.push ({
                title : info.videoDetails.title,
                pic : info.videoDetails.thumbnail.thumbnails[0].url,
                url : playlist[i]
            });
        }

        if (this.isPlaying) {
            this.msgEmbed();
        } else {
            this.isPlaying = true;
            this.play();
        }
    }

    async play() {
        console.log(`Now play : ${ this.queue[0].title }`);
        this.dispatcher = this.connection.play(ytdl(this.queue[0].url, { filter: "audio" }));
        this.dispatcher.setVolume(this.volume);
        this.msgEmbed();

        this.dispatcher.on('finish', () => {
            this.queue.shift();
            if (this.queue.length != 0) {
                this.play(this.queue[0]);
            } else {
                console.log(`Finished playing`);
                // Before exit delete player and reset constructor
                this.embed.delete();
                this.connection.disconnect();
                this.reset();
            }
        });
    }

    async msgEmbed() {
        // Delete previous Music Player
        if (this.embed) { await this.embed.delete() }

        // Create new Music Player
        const musicPlayerEmbed = new Discord.MessageEmbed()
            .setColor('BLUE')
            .setTitle(this.queue[0].title)
            .setThumbnail(this.queue[0].pic)
            .addField(`🎵  Playlist`,this.queue.map((item,index) => `[${index+1}] ${item.title}`));

        let sentMusicPlayerEmbed = await this.msg.send(musicPlayerEmbed)
        this.embed = sentMusicPlayerEmbed; // Mark the Player MessageID
        sentMusicPlayerEmbed.react('🔈')
            .then(() => {
                sentMusicPlayerEmbed.react('🔊');
                sentMusicPlayerEmbed.react('⏹️');
                sentMusicPlayerEmbed.react('⏭️');
                sentMusicPlayerEmbed.react('⏸️');
            });
        
        let filter = (reaction, user) => !user.bot;
        const reactionCollector = sentMusicPlayerEmbed.createReactionCollector(filter);

        reactionCollector.on('collect', (reaction,user) => {
            if (reaction.emoji.name === '⏸️') {
                this.dispatcher.pause();
                reaction.remove();
                sentMusicPlayerEmbed.react('▶️');
            } else if (reaction.emoji.name === '▶️') {
                this.dispatcher.resume();
                reaction.remove();
                sentMusicPlayerEmbed.react('⏸️');
            } else if (reaction.emoji.name === '⏹️') {
                this.dispatcher.resume();
                this.queue = [];
                this.dispatcher.end();
            } else if (reaction.emoji.name === '⏭️') {
                this.dispatcher.resume();
                this.dispatcher.end();
                reaction.remove();
            } else if (reaction.emoji.name === '🔈') {
                if (this.volume != 0){
                    this.volume = this.volume - 0.1;
                    this.dispatcher.setVolume(this.volume);
                }
                reaction.users.remove(user.id);
            } else if (reaction.emoji.name === '🔊') {
                if (this.volume != 10) {
                    this.volume = this.volume + 0.1;
                    this.dispatcher.setVolume(this.volume);
                }
                reaction.users.remove(user.id);
            } else {
                reaction.remove();
            }
        });
    }

    reset() {
        this.isPlaying = false;
        this.queue = [];
        this.connection = {};
        this.dispatcher = {};
        this.embed = null;
        this.msg = null;
        this.volume = 0.2;
    }
}

const music = new Music();

client.on('ready', () => {
    // Customize bot name
    //client.user.setUsername('Music.Bot');
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
    let command = message.content.split(' ')[0].slice(1);
    let musicLink = message.content.replace('!' + command, '').split(/\n| /); // Separate the link by split space and enter
    let list = [];
    let totaladd = 0;
    
    switch (command) {
        case 'music':
            let voiceChannel = message.member.voice.channel;
            //let voiceChannel = client.channels.cache.get(''); // Use for locate special channel

            // Check voice channel connection
            if (!voiceChannel) {
                return message.delete()
                    .then(msg => msg.channel.send (
                        new Discord.MessageEmbed()
                            .setColor('RED')
                            .setTitle(`⚠️  Unable to Play Music`)
                            .setDescription('Please join the voice channel first\n'+
                                            '(This message will delete after 30 second)'))
                        .then(msg => msg.delete({timeout: 30000})));
            } else {
                music.connection = await voiceChannel.join();
            }

            // Verify YouTube Link
            musicLink.forEach(value => {
                if (value.length != 0 && ytdl.validateURL(value)) {
                    totaladd = totaladd + 1;
                    list.push(value);
                }
            });

            // Send music added message
            if (totaladd == 0) {
                return message.delete()
                    .then(msg => msg.channel.send (
                        new Discord.MessageEmbed()
                            .setColor('RED')
                            .setTitle(`⚠️  No Music added`)
                            .setDescription('Please enter the valid YouTube link\n'+
                                            '(This message will delete after 30 second)'))
                        .then(msg => msg.delete({timeout: 30000})));
            } else {
                music.add(message,list); // Add play list to queue
                console.log(`${message.author.username} Added ${totaladd} music to queue`);

                message.delete()
                    .then(msg => msg.channel.send (
                        new Discord.MessageEmbed()
                            .setColor('GREEN')
                            .setTitle(`✅  Added ${totaladd} music to queue`)
                            .setDescription('(This message will delete after 10 second)'))
                        .then(msg => msg.delete({timeout: 10000})));
            }
        break;

        // Reset the Bot
        case 'reset':
            music.reset();
            message.delete()
            .then(msg => msg.channel.send (
                new Discord.MessageEmbed()
                    .setColor('BLUE')
                    .setTitle(`🔄  MusicBot Resetted`)
                    .setDescription('(This message will delete after 10 second)'))
                .then(msg => msg.delete({timeout: 10000})));
        break;
    }
});

client.login(token);
