const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');

class Music {
    
    constructor(){
        this.isPlaying = false;
        this.queue = [];
        this.connection = {};
        this.dispatcher = {};
        this.embed = null;
        this.msg = null;
        this.userreact = null;
        this.volume = 0.2;
    }

    gettime(){
        // Set current time
        let date = new Date();
        let year=date.getFullYear(); //获取当前年份   
        let mon=date.getMonth()+1; //获取当前月份   
        let day=date.getDate(); //获取当前日
        let h=(date.getHours() > 12) ? date.getHours()-12 : date.getHours(); //获取小时
        let apm=(date.getHours() > 12) ? 'PM' : 'AM'; //Get AM/PM
        let m=date.getMinutes(); //获取分钟
        let s=date.getSeconds(); //获取秒
        return `[${year}/${mon}/${day} | ${h}:${m}:${s} ${apm}]`;
    }

    async msgEmbed(){
        // Check the last message is user or music controller
        if (this.msg){
            var message = this.msg;
            this.msg = null;
            if (this.embed){this.embed.delete()}
        } else {
            var message = this.embed;
        }

        let deletedMessage = await message.delete();
        const musicPlayerEmbed = new Discord.MessageEmbed()
            .setColor('BLUE')
            .setTitle(this.queue[0].title)
            .setThumbnail(this.queue[0].pic)
            .addField(`🎵  Playlist`,this.queue.map((item,index) => `[${index+1}] ${item.title}`));
        
        let sentMusicPlayerEmbed = await deletedMessage.channel.send(musicPlayerEmbed);
        sentMusicPlayerEmbed.react('🔈');
        sentMusicPlayerEmbed.react('🔊');
        sentMusicPlayerEmbed.react('⏹️');
        sentMusicPlayerEmbed.react('⏭️');
        sentMusicPlayerEmbed.react('⏸️');

        let filter = (reaction, user) => !user.bot;
        const reactionCollector = sentMusicPlayerEmbed.createReactionCollector(filter);

        reactionCollector.on('collect', (reaction) => {
            if (reaction.emoji.name === '⏸️') {
                this.dispatcher.pause();
                reaction.remove();
                sentMusicPlayerEmbed.react('▶️');
            } else if (reaction.emoji.name === '▶️') {
                this.dispatcher.resume();
                reaction.remove();
                sentMusicPlayerEmbed.react('⏸️');
            } else if (reaction.emoji.name === '⏹️') {
                this.queue = [];
                this.dispatcher.end();
            } else if (reaction.emoji.name === '⏭️') {
                this.dispatcher.end();
                reaction.remove();
            } else if (reaction.emoji.name === '🔈') {
                if (this.volume != 0){
                    this.volume = this.volume - 0.1;
                    this.dispatcher.setVolume(this.volume);
                }
                reaction.users.remove(this.userreact);
            } else if (reaction.emoji.name === '🔊') {
                if (this.volume != 10){
                    this.volume = this.volume + 0.1;
                    this.dispatcher.setVolume(this.volume);
                }
                reaction.users.remove(this.userreact);
            } else {
                reaction.remove();
            }
        });
        this.embed = sentMusicPlayerEmbed;
    }

    async play(musicInfo){
        console.log(`${this.gettime()} Now play: ${this.queue[0].title}`);
        this.dispatcher = this.connection.play(ytdl(musicInfo.url, { filter: "audio" }));
        this.dispatcher.setVolume(this.volume);
        this.msgEmbed();

        this.dispatcher.on('finish', () => {
            this.queue.shift();
            if (this.queue.length != 0){
                return this.play(this.queue[0]);
            } else {
                console.log(`${this.gettime()} Finished playing`);
                this.embed.delete();
                this.connection.disconnect();
                this.isPlaying = false;
                this.queue = [];
                this.connection = {};
                this.dispatcher = {};
                this.embed = null;
                this.msg = null;
            }
        });
    }

    async add(musicLink){
        let info = await ytdl.getBasicInfo(musicLink);
        this.queue.push({
            title:info.videoDetails.title,
            pic:info.videoDetails.thumbnail.thumbnails[0].url,
            url:musicLink
        });



        if (this.isPlaying){
            console.log(`${this.gettime()} Added new Music [${info.videoDetails.title}] (Total:${this.queue.length})`);
            this.msgEmbed();
        } else {
            this.isPlaying = true;
            this.play(this.queue[0]);
        }
    }
}

const music = new Music();

// When Bot online 
client.on('ready', () => {
    // Customize bot name
    //client.user.setUsername('Music.Bot');
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageReactionAdd', async (reaction, user) => {
    music.userreact = user.id;
});

// When Bot receive message
client.on('message', async message => {
    // Voice only works in guilds, if the message does not come from a guild, we ignore it

    let command = message.content.split(' ')[0].slice(1);
    let musicLink = message.content.replace('!' + command, '').split(/\n| /);
    
    switch(command){
        case 'music':{
            // Verify YouTube URL
            let urlValidity = ytdl.validateURL(musicLink);
            if (!urlValidity) {
                return message.delete()
                .then(msg => {
                    let msgembed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('⚠️  Cannot found YouTube URL !')
                        .setDescription('Please enter valid YouTube URL !\n(This message will delete after 10 second)');
                    msg.channel.send(msgembed).then(msg => {msg.delete({timeout: 10000})});
                });}
                  
            let voiceChannel = client.channels.cache.get('774603073661435904');
            music.connection = await voiceChannel.join();

            music.msg = message;
            music.add(musicLink);

            break;
        }
    }
});

client.login(token);
