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

client = commands.Bot(command_prefix='?')

@client.event
async def on_ready():
    change_status.start()
    print(f'We have logged in as {client.user}')


status = ['Being a Potato', 'Having some good eats!', 'Zzzzzzzzz!', 'Gwaaaaa!!!', 'some 27D Chess']
@tasks.loop(seconds=20)
async def change_status():
    await client.change_presence(activity=discord.Game(choice(status)))

client.run('NzQ0MDQwNTk4MjcyNDc1MTgw.Xzdbzg.Qtw6mSSL7k99u5lHJNMQitYcGWE') #put your token here
