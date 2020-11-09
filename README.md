# Discord-MusicBot
The simple discord music bot, use emoji reaction to make player feature.

**MusicBot has the following functions:**
- Play YouTube songs by URL
- Pause/Resume music
- Skip current music
- Add and play music by queue
- Volume up/down

### Require npm module (Node.js 12.0.0 or newer is required)
- [discord.js](https://github.com/discordjs/discord.js/) <br>
```npm install discord.js```
- [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) (Perform music conversion and streaming functions) <br>
```npm install ffmpeg-static```
- [discordjs/opus](https://github.com/discordjs/opus) (Opus encoder) <br>
```npm install @discordjs/opus```
- [node-ytdl-core](https://github.com/fent/node-ytdl-core) (Get YouTube videos info) <br>
```npm install ytdl-core```

### Command
- ```!music``` (Add music, support multi insert) <br>
Example: ```!music https://www.youtube.com/watch?v=dhYOPzcsbGM``` <br>
- ```!reset``` (Reset when bot crush)
