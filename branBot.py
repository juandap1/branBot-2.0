import discord
from discord.ext import commands, tasks
from discord.voice_client import VoiceClient
import youtube_dl
import mysql.connector
import json
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from youtube_search import YoutubeSearch
import random
from random import choice
import time
import asyncio
import pafy

youtube_dl.utils.bug_reports_message = lambda: ''

ytdl_format_options = {
    'format': 'bestaudio/best',
    'outtmpl': '%(extractor)s-%(id)s-%(title)s.%(ext)s',
    'restrictfilenames': True,
    'noplaylist': True,
    'nocheckcertificate': True,
    'ignoreerrors': False,
    'logtostderr': False,
    'quiet': True,
    'no_warnings': True,
    'default_search': 'auto',
    'source_address': '0.0.0.0' # bind to ipv4 since ipv6 addresses cause issues sometimes
}

ffmpeg_options = {
    'options': '-vn -ss 00:00:30.0'
}

ffmpeg_options2 = {
    'options': '-vn'
}

ytdl = youtube_dl.YoutubeDL(ytdl_format_options)

class YTDLSource(discord.PCMVolumeTransformer):
    def __init__(self, source, *, data, volume=0.5):
        super().__init__(source, volume)

        self.data = data

        self.title = data.get('title')
        self.url = data.get('url')

    @classmethod
    async def from_url(cls, url, *, loop=None, stream=False):
        loop = loop or asyncio.get_event_loop()
        data = await loop.run_in_executor(None, lambda: ytdl.extract_info(url, download=not stream))

        if 'entries' in data:
            # take first item from a playlist
            data = data['entries'][0]

        filename = data['url'] if stream else ytdl.prepare_filename(data)
        return cls(discord.FFmpegPCMAudio(filename, **ffmpeg_options), data=data)

class YTDLSource2(discord.PCMVolumeTransformer):
    def __init__(self, source, *, data, volume=0.5):
        super().__init__(source, volume)

        self.data = data

        self.title = data.get('title')
        self.url = data.get('url')

    @classmethod
    async def from_url(cls, url, *, loop=None, stream=False):
        loop = loop or asyncio.get_event_loop()
        data = await loop.run_in_executor(None, lambda: ytdl.extract_info(url, download=not stream))

        if 'entries' in data:
            # take first item from a playlist
            data = data['entries'][0]

        filename = data['url'] if stream else ytdl.prepare_filename(data)
        return cls(discord.FFmpegPCMAudio(filename, **ffmpeg_options2), data=data)


client = commands.Bot(command_prefix='?')


mydb = mysql.connector.connect(
  host="localhost",
  port="3306",
  user="root",
  password="Blueninja123",
  database="musicbot"
)

status = ['Being a Potato', 'Having some good eats!', 'Zzzzzzzzz!', 'Gwaaaaa!!!', 'some 27D Chess']
queue = []

@client.event
async def on_ready():
    change_status.start()
    print(f'We have logged in as {client.user}')

@client.command(name='ping', help='This command returns the latency')
async def ping(ctx):
    await ctx.send(f'**Pong!** Latency: {round(client.latency * 1000)}ms')

scored = 0

#@client.event
#async def on_message(ctx):
#    if ctx.author.id == 427938840926355457:
#        await ctx.channel.send("Kreygasm")

@client.command(name='quiz', help='This command starts music quiz!')
async def quiz(ctx, *args):
        voice_client = discord.utils.get(client.voice_clients, guild=ctx.guild)
        if voice_client and voice_client.is_connected():
            return
        else:
            if not ctx.message.author.voice:
                await ctx.send("Connect to a voice channel to play the quiz")
                return
            else:
                channel = ctx.message.author.voice.channel
            await channel.connect()
            artist_search = False
            if len(args) == 0:
                mycursor = mydb.cursor()
                mycursor.execute("SELECT * FROM songs")
                songs = mycursor.fetchall()
                song = random.choice(songs)
            else:
                if args[0].lower() == "disney":
                    mycursor = mydb.cursor()
                    mycursor.execute("SELECT * FROM songs WHERE disney = 1")
                    songs = mycursor.fetchall()
                    song = random.choice(songs)
                else:
                    mycursor = mydb.cursor()
                    sql = "SELECT * FROM songs WHERE artist = %s"
                    val = (args[0], )
                    mycursor.execute(sql, val)
                    songs = mycursor.fetchall()
                    song = random.choice(songs)
                    artist_search = True
            song_name = song[1]
            song_artist = song[2]
            await ctx.send("You have 30 seconds to guess. You will receive points for correctly guessing the artist and the song.")
            server = ctx.message.guild
            voice_channel = server.voice_client
            async with ctx.typing():
                if "www.youtube.com" in song[3]:
                    player = await YTDLSource.from_url(song[3], loop=client.loop)
                    voice_channel.play(player, after=lambda e: print('Player error: %s' % e) if e else None)
                else:
                    sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id='cab5f78e5e2a44b993bcd3e999fa8a0e',client_secret='30a6d373970b49519b6e94e415254f8b'))
                    results = sp.track(song[3])
                    _song = results['name']
                    _uri = results['uri']
                    _songArtist = sp.track(_uri)
                    _Artist = _songArtist['artists']
                    _jsonPart = json.dumps(_Artist)
                    _findArtist = sp.artist(_jsonPart[32:86])
                    _youtubeArtist = _findArtist['name']
                    results1 = YoutubeSearch(f'{_song} {_youtubeArtist} lyrics', max_results=1).to_json()
                    _youtubeSearch= results1.split(':')
                    _myLinkLast = _youtubeSearch[len(_youtubeSearch)-1].replace('"}]}','')
                    _myLinkStart = _myLinkLast.replace('"/','')
                    _myYoutubeURL = _myLinkStart.strip()
                    _replaceUrl = f"https://www.youtube.com/{_myYoutubeURL}"
                    player = await YTDLSource.from_url(_replaceUrl, loop=client.loop)
                    voice_channel.play(player, after=lambda e: print('Player error: %s' % e) if e else None)
            name_com = song_name.replace(",", "").replace("(","").replace(")","").lower()
            name_b = name_com.split(" ")
            artists = song_artist.lower().split(", ")
            #Check to make sure user is in the right channel, check to see if guess is right
            def response_check(m):
                if m.channel == ctx.message.channel and m.author.voice and not m.author.bot:
                    no_commas = m.content.replace(",", "").lower()
                    breakdown = no_commas.split(" ")
                    artist_check = m.content.lower().split(", ")
                    count = 0
                    global scored
                    for x in breakdown:
                        if x in name_b:
                            count += 1
                    if not artist_search:
                        for x in artist_check:
                            if x in artists:
                                scored = m.author.id
                                return True
                    if count/len(name_b) > 0.5:
                        scored = m.author.id
                        return True
                #await m.add_reaction("\U0000274C")
                return False
            try:
                global scored
                msg = await client.wait_for('message', check=response_check, timeout=32)
                await ctx.message.guild.voice_client.disconnect()
                await ctx.send("<@" + str(msg.author.id) + "> gets a point! The song was: " + song_name + " - " + song_artist)
                mycursor = mydb.cursor()
                sql = "SELECT COUNT(*) FROM score WHERE userID = %s"
                val = (scored, )
                mycursor.execute(sql, val)
                check = mycursor.fetchone()
                if check[0] == 0:
                    sql = "INSERT INTO score (userID, points) VALUES (%s, %s)"
                    val = (scored, 1)
                    mycursor.execute(sql, val)
                    mydb.commit()
                else:
                    sql = "UPDATE score SET points = points + 1 WHERE userID = %s"
                    val = (scored, )
                    mycursor.execute(sql, val)
                    mydb.commit()
            except asyncio.TimeoutError:
                await ctx.send("The song was: " + song_name + " - " + song_artist)
                await ctx.message.guild.voice_client.disconnect()



adding = []

@client.command(name='add', help='Add a song to the quiz (?add URL)')
async def add(ctx, url):
    if ctx.guild.id == 781734585896534066:
        mycursor = mydb.cursor()
        name = ""
        artist = ""
        author = ctx.message.author
        def check(m):
            return m.author == author and m.channel == channel and "?add" not in m.content
        def check2(m):
            return m.author == author and m.channel == channel and "y" == m.content or "n" == m.content
        if author not in adding:
            adding.append(author)
            channel = ctx.message.channel
            sql = "SELECT * FROM songs WHERE youtube_link LIKE %s"
            val = (url, )
            mycursor.execute(sql, val)
            alrAdded = mycursor.fetchall()
            if len(alrAdded) != 0:
                for x in alrAdded:
                    await ctx.send("<@" + str(author.id) + ">Is this the same as your song (y or n):\n " + x[1] + " | " + x[2])
                    msg = await client.wait_for('message', check=check2)
                    if msg.content == "y":
                        await ctx.send("<@" + str(author.id) + ">This song has already been added!")
                        adding.remove(author)
                        return
            await ctx.send("<@" + str(author.id) + ">What is the title of the song you're adding?")
            msg = await client.wait_for('message', check=check)
            name = msg.content
            sql = "SELECT * FROM songs WHERE LOWER(song_title) LIKE %s"
            val = (name.lower(), )
            mycursor.execute(sql, val)
            songs = mycursor.fetchall()
            if len(songs) != 0:
                for x in songs:
                    await ctx.send("<@" + str(author.id) + ">Is this the same as your song (y or n):\n " + x[1] + " | " + x[2])
                    msg = await client.wait_for('message', check=check2)
                    if msg.content == "y":
                        await ctx.send("<@" + str(author.id) + ">This song has already been added!")
                        adding.remove(author)
                        return
            await ctx.send("<@" + str(author.id) + ">What artist performed the song you're adding?")
            msg = await client.wait_for('message', check=check)
            artist = msg.content
            sql = "INSERT INTO songs (song_title, artist, youtube_link) VALUES (%s, %s, %s)"
            val = (name, artist, url)
            mycursor.execute(sql, val)
            mydb.commit()
            await ctx.send("<@" + str(author.id) + ">Successfully added " + name + " | " + artist)
            adding.remove(author)
            channel = client.get_channel(783453375693193257)
            await channel.send(name + " | " + artist)
        else:
            return
    else:
        return

@client.command(name="leaderboard", help="See Leaderboard for the quiz bot")
async def leaderboard(ctx):
    requester = ctx.message.author.id
    mycursor = mydb.cursor()
    sql = "SELECT points FROM score WHERE userID = %s"
    val = (requester, )
    mycursor.execute(sql, val)
    score = mycursor.fetchone()[0]
    sql = "SELECT * FROM score ORDER BY points DESC"
    mycursor.execute(sql)
    players = mycursor.fetchall()
    user = await client.fetch_user(requester)
    leaderboard = "Music Quiz Leaderboard\nRequested by **" + user.display_name + "**: " + str(score) + " points\n---------------------------------------------\n`"
    if len(players) > 10:
        for x in range(0, 10):
            player = await client.fetch_user(players[x][1])
            leaderboard += player.display_name + ": " + str(players[x][2]) + " points\n"
    else:
        for x in players:
            player = await client.fetch_user(x[1])
            leaderboard += player.display_name + ": " + str(x[2]) + " points\n"
    await ctx.send(leaderboard + "`")

@client.command(name="playlist", help="Play a random song from the playlist")
async def playlist(ctx):
    if not ctx.message.author.voice:
        await ctx.send("Connect to a voice channel to play the quiz")
        return
    else:
        channel = ctx.message.author.voice.channel
    await channel.connect()
    server = ctx.message.guild
    voice_channel = server.voice_client
    mycursor = mydb.cursor()
    mycursor.execute("SELECT * FROM songs")
    songs = mycursor.fetchall()
    song = random.choice(songs)
    if "www.youtube.com" in song[3]:
        player = await YTDLSource2.from_url(song[3], loop=client.loop)
        voice_channel.play(player, after=lambda e: print('Player error: %s' % e) if e else None)
        length = pafy.new(song[3]).length
    else:
        sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id='cab5f78e5e2a44b993bcd3e999fa8a0e',client_secret='30a6d373970b49519b6e94e415254f8b'))
        results = sp.track(song[3])
        _song = results['name']
        _uri = results['uri']
        _songArtist = sp.track(_uri)
        _Artist = _songArtist['artists']
        _jsonPart = json.dumps(_Artist)
        _findArtist = sp.artist(_jsonPart[32:86])
        _youtubeArtist = _findArtist['name']
        results1 = YoutubeSearch(f'{_song} {_youtubeArtist} lyrics', max_results=1).to_json()
        _youtubeSearch= results1.split(':')
        _myLinkLast = _youtubeSearch[len(_youtubeSearch)-1].replace('"}]}','')
        _myLinkStart = _myLinkLast.replace('"/','')
        _myYoutubeURL = _myLinkStart.strip()
        _replaceUrl = f"https://www.youtube.com/{_myYoutubeURL}"
        player = await YTDLSource2.from_url(_replaceUrl, loop=client.loop)
        voice_channel.play(player, after=lambda e: print('Player error: %s' % e) if e else None)
        length = pafy.new(_replaceUrl).length
    #await ctx.send("Playlist Finished")
    print(length)
    time.sleep(length)
    await ctx.message.guild.voice_client.disconnect()

@client.command(name="leave", help="Exit the VC")
async def leave(ctx):
    await ctx.message.guild.voice_client.disconnect()

@client.command(name="count", help="Lists number of quiz songs")
async def count(ctx):
    mycursor = mydb.cursor()
    mycursor.execute("SELECT * FROM songs")
    songs = mycursor.fetchall()
    await ctx.send("There are currently " + str(len(songs)) + " songs being tested")

#@client.command(name="list", help="Lists out all quiz songs")
#async def list(ctx):
#    mycursor = mydb.cursor()
#    mycursor.execute("SELECT * FROM songs")
#    songs = mycursor.fetchall()
#    for x in songs:
#        await ctx.send(x[1] + " | " + x[2])

@tasks.loop(seconds=20)
async def change_status():
    await client.change_presence(activity=discord.Game(choice(status)))


stabGifs = ["https://tenor.com/62VK.gif", "https://tenor.com/OCSq.gif", "https://tenor.com/63Cx.gif", "https://tenor.com/beF5i.gif", "https://tenor.com/tV4l.gif", "https://tenor.com/IpBO.gif", "https://tenor.com/9gOo.gif", "https://media1.tenor.com/images/2f3cd139c2b74c266c42de07e13a11bd/tenor.gif?itemid=13597853", "https://media2.giphy.com/media/26ufmyMG2QKrpIS3u/giphy.gif", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL0eZvlKdCkRsdlioHr2Za4I088FCc7foALg&usqp=CAU"]

@client.command(name="stab", help="Stab someone")
async def stab(ctx, recipient):
    gif = random.choice(stabGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is stabbing **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is stabbing **" + recipient + "**")
        await ctx.send(gif)

bonkGifs = ["https://tenor.com/bmhdo.gif","https://tenor.com/bm9Ca.gif", "https://tenor.com/bjZOU.gif", "https://tenor.com/bkeTz.gif", "https://tenor.com/bd7Wt.gif", "https://tenor.com/bdrKU.gif", "https://tenor.com/bl2Xq.gif", "https://tenor.com/boJeR.gif", "https://tenor.com/bihkr.gif", "https://tenor.com/JJuM.gif"]

@client.command(name="bonk", help="Bonk someone")
async def bonk(ctx, recipient):
    gif = random.choice(bonkGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is bonking **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is bonking **" + recipient + "**")
        await ctx.send(gif)

pokeGifs = ["https://tenor.com/1WH6.gif", "http://gph.is/2d7Lruc", "https://tenor.com/biJkz.gif", "https://tenor.com/bjMMa.gif", "https://tenor.com/8wsA.gif", "http://gph.is/292BdIb", "https://tenor.com/1AIo.gif", "https://tenor.com/bnsXU.gif", "https://tenor.com/0BCE.gif", "https://media0.giphy.com/media/26gZ1hSGD3TfiyXHW/giphy.gif"]

@client.command(name="poke", help="Poke someone")
async def poke(ctx, recipient):
    gif = random.choice(pokeGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is poking **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is poking **" + recipient + "**")
        await ctx.send(gif)

nomGifs = ["https://tenor.com/beo2s.gif", "https://tenor.com/3VN4.gif", "https://tenor.com/bfykN.gif", "https://tenor.com/Poyk.gif"]

@client.command(name="nom", help="Nom someone")
async def nom(ctx, recipient):
    gif = random.choice(nomGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** noms **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** noms **" + recipient + "**")
        await ctx.send(gif)

shootGifs = ["https://tenor.com/bf3H2.gif", "https://tenor.com/wgj9.gif", "https://tenor.com/wgj5.gif", "https://tenor.com/view/seal-shoot-shot-eggplant-cute-gif-16533278", "https://tenor.com/2SB7.gif"]

@client.command(name="shoot", help="Shoot someone")
async def shoot(ctx, recipient):
    gif = random.choice(shootGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is shooting **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is shooting **" + recipient + "**")
        await ctx.send(gif)

boopGifs = ["https://tenor.com/bnpEi.gif", "https://tenor.com/7OzO.gif", "https://tenor.com/WtOM.gif", "https://tenor.com/92j1.gif", "https://tenor.com/xT1J.gif"]

@client.command(name="boop", help="Boop someone")
async def boop(ctx, recipient):
    gif = random.choice(boopGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is booping **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is booping **" + recipient + "**")
        await ctx.send(gif)

smhGifs = ["https://tenor.com/bcWzX.gif", "https://tenor.com/ujxe.gif", "https://tenor.com/1CcO.gif", "https://tenor.com/WzNB.gif", "https://tenor.com/wMPx.gif"]

@client.command(name="smh", help="shake your head at someone")
async def smh(ctx, recipient):
    gif = random.choice(smhGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is shaking their head at **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is shaking their head at **" + recipient + "**")
        await ctx.send(gif)

angryGifs = ["https://tenor.com/W7sW.gif", "https://tenor.com/xMpa.gif", "https://tenor.com/2TXT.gif", "https://tenor.com/bb4qh.gif", "https://tenor.com/8GZ0.gif", "https://tenor.com/PhmM.gif"]

@client.command(name="angry", help="get angry at someone")
async def angry(ctx, recipient):
    gif = random.choice(angryGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is angry at **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is angry at **" + recipient + "**")
        await ctx.send(gif)

sadGifs = ["https://tenor.com/tFAk.gif", "https://tenor.com/beNKt.gif", "https://tenor.com/baKVo.gif", "https://tenor.com/K3Oi.gif", "https://tenor.com/PlOc.gif", "https://tenor.com/bdpsX.gif", "https://tenor.com/FNx7.gif"]

@client.command(name="sad", help="sad at someone")
async def sad(ctx, recipient):
    gif = random.choice(sadGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is sad because of **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is sad because of **" + recipient + "**")
        await ctx.send(gif)

glompGifs = ["https://tenor.com/xNYs.gif", "https://tenor.com/uN12.gif", "https://tenor.com/bdz5a.gif", "https://tenor.com/bk1Ns.gif", "https://tenor.com/bavOy.gif", "https://tenor.com/wKgs.gif", "https://tenor.com/x6rH.gif"]

@client.command(name="glomp", help="glomp someone")
async def glomp(ctx, recipient):
    gif = random.choice(glompGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is glomping **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is glomping **" + recipient + "**")
        await ctx.send(gif)

sleepGifs = ["https://tenor.com/bb0sW.gif", "https://tenor.com/benW0.gif", "https://tenor.com/bhSCJ.gif", "https://tenor.com/0JNH.gif", "https://cdn.discordapp.com/attachments/757631050762682378/786418754023325727/dream-clipart-sleep-gif-7.gif", "https://tenor.com/8XzL.gif", "https://cdn.discordapp.com/attachments/757631050762682378/786423387881734154/3af785a5a7805e1e9d9de2568af17fb2.gif", "https://cdn.discordapp.com/attachments/757631050762682378/786423985700732968/5a47a293a2833ecdb5a22835cf21c8e5.gif", "https://cdn.discordapp.com/attachments/757631050762682378/786424090864255016/f328ac09563c40b12f8f56dad277eb97.gif"]

@client.command(name="sleep", help="say goodnight to someone")
async def sleep(ctx, recipient):
    gif = random.choice(sleepGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is saying goodnight to **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is saying goodnight to **" + recipient + "**")
        await ctx.send(gif)

sipGifs = ["https://cdn.discordapp.com/attachments/757631050762682378/786423768368021524/tenor.gif"]

@client.command(name="sip", help="sip at someone")
async def sip(ctx, recipient):
    gif = random.choice(sipGifs)
    if "<@" in recipient:
        user = await client.fetch_user(int(recipient.replace("<@!", "").replace(">", "")))
        stabbed = user.display_name
        await ctx.send("**" + ctx.message.author.display_name + "** is sipping at **" + stabbed + "**")
        await ctx.send(gif)
    else:
        await ctx.send("**" + ctx.message.author.display_name + "** is sipping at **" + recipient + "**")
        await ctx.send(gif)

eatGifs = ["https://tenor.com/wS88.gif", "https://tenor.com/s1NU.gif", "https://tenor.com/SPjp.gif", "https://tenor.com/wH0h.gif", "https://tenor.com/uvwQ.gif", "http://gph.is/1LixmjH"]

@client.command(name="eat", help="have some good eats")
async def eat(ctx):
    gif = random.choice(eatGifs)
    await ctx.send("**" + ctx.message.author.display_name + "** is Eating")
    await ctx.send(gif)

client.run('NzQ0MDQwNTk4MjcyNDc1MTgw.Xzdbzg.Qtw6mSSL7k99u5lHJNMQitYcGWE') #put your token here
