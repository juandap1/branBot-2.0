var mysql = require('mysql');
var connection = require('./connect').establishConnect();
var token = require('./token');
var MojangAPI = require('mojang-api');
const Hypixel = require('hypixel-api-reborn');
const hypixel = new Hypixel.Client('75291082-db27-4f7f-9920-d7faa17b7f51');
const Canvas = require("canvas");
const fs = require('fs');
const util = require('util');
const path = require('path');
const request = require('request');
const { Readable } = require('stream');
const { API, Regions, Locales, Queue } = require("node-valorant-api");

const APIKey = "RGAPI-01aa9cf6-965f-49f7-9e64-025cdb8b5b92"; // Your API Key

// The third parameter is the Region for the Account API
// choose the one that is the closest to you
const valorant = new API(Regions.NA, APIKey, Regions.AMERICAS); // An API instance for Valorant query
valorant.ContentV1.getContent(Locales["en-US"]).then(content => {
    console.log(content.characters.map(char => { return char.name }));
});
//////////////////////////////////////////
///////////////// VARIA //////////////////
//////////////////////////////////////////

function necessary_dirs() {
    if (!fs.existsSync('./data/')){
        fs.mkdirSync('./data/');
    }
}
necessary_dirs()

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function convert_audio(input) {
    try {
        // stereo to mono channel
        const data = new Int16Array(input)
        const ndata = new Int16Array(data.length/2)
        for (let i = 0, j = 0; i < data.length; i+=4) {
            ndata[j++] = data[i]
            ndata[j++] = data[i+1]
        }
        return Buffer.from(ndata);
    } catch (e) {
        console.log(e)
        console.log('convert_audio: ' + e)
        throw e;
    }
}
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


//////////////////////////////////////////
//////////////// CONFIG //////////////////
//////////////////////////////////////////

const SETTINGS_FILE = 'settings.json';

let DISCORD_TOK = null;
let WITAPIKEY = null;
let SPOTIFY_TOKEN_ID = null;
let SPOTIFY_TOKEN_SECRET = null;

function loadConfig() {
    if (fs.existsSync(SETTINGS_FILE)) {
        const CFG_DATA = JSON.parse( fs.readFileSync(SETTINGS_FILE, 'utf8') );
        DISCORD_TOK = CFG_DATA.discord_token;
        WITAPIKEY = CFG_DATA.wit_ai_token;
        SPOTIFY_TOKEN_ID = CFG_DATA.spotify_token_id;
        SPOTIFY_TOKEN_SECRET = CFG_DATA.spotify_token_secret;
    } else {
        DISCORD_TOK = process.env.DISCORD_TOK;
        WITAPIKEY = process.env.WITAPIKEY;
        SPOTIFY_TOKEN_ID = process.env.SPOTIFY_TOKEN_ID;
        SPOTIFY_TOKEN_SECRET = process.env.SPOTIFY_TOKEN_SECRET;
    }
    if (!DISCORD_TOK || !WITAPIKEY)
        throw 'failed loading config #113 missing keys!'

}
loadConfig()


const https = require('https')
function listWitAIApps(cb) {
    const options = {
      hostname: 'api.wit.ai',
      port: 443,
      path: '/apps?offset=0&limit=100',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+WITAPIKEY,
      },
    }

    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      });
      res.on('end',function() {
        cb(JSON.parse(body))
      })
    })

    req.on('error', (error) => {
      console.error(error)
      cb(null)
    })
    req.end()
}
function updateWitAIAppLang(appID, lang, cb) {
    const options = {
      hostname: 'api.wit.ai',
      port: 443,
      path: '/apps/' + appID,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+WITAPIKEY,
      },
    }
    const data = JSON.stringify({
      lang
    })

    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      });
      res.on('end',function() {
        cb(JSON.parse(body))
      })
    })
    req.on('error', (error) => {
      console.error(error)
      cb(null)
    })
    req.write(data)
    req.end()
}
process.on("unhandledRejection", console.error);
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

const EMOJI_GREEN_CIRCLE = '<:hinataThumbsUp:812737382330662933>';
const EMOJI_RED_CIRCLE = '🔴';

const GENRES = {
    'hip-hop': ['hip-hop', 'hip hop', 'hiphop', 'rap'],
    'rock': ['rock'],
    'dance': ['dance'],
    'trance': ['techno'],
    'trance': ['trance'],
    'groove': ['groove'],
    'classical': ['classical'],
    'techno': ['techno'],

}
/*hypixel.getPlayer('JuanPabby').then(player => {
  console.log(player); // 141
}).catch(e => {
  console.error(e);
});*/


/*connection.query('SELECT * FROM stats', function (error, results, fields) {
    if (error)
        throw error;

    results.forEach(result => {
        var xp = Math.floor(result.vcTime/30);
        for (var i = 0; i < result.messageCount; i++) {
          xp += (Math.floor(Math.random() * 3) + 2);
        }
        var sql = "UPDATE stats SET xp = ? WHERE id= ?";
        connection.query(sql, [xp, result.id], function (err, result) {
          if (err) throw err;
        });
    });
});*/

const Discord = require('discord.js');
const client = new Discord.Client();

//functions
function randomInd(arr) {
  var index = Math.floor(Math.random()*arr.length);
  return arr[index];
}

function timeSince(date) {
  var since = "";
  var seconds = Math.floor((new Date() - date) / 1000);
  var years = Math.floor(seconds / 31536000);
  if (years != 0) {
    seconds -= years*31536000;
    if (years == 1) {
      since += "1 year";
    } else {
      since += years + " years";
    }
  }
  var days = Math.floor(seconds / 86400);
  if (days != 0) {
    if (years != 0) {
      since += " and ";
    }
    if (days == 1) {
      since += "1 day";
    } else {
      since += days + " days";
    }
  } else {
    if (year == 0) {
      since = "Today";
    }
  }
  if (since != "Today") {
    since += " ago";
  }
  return since;
}

function identify(inp, msg) {
  if (inp.includes("<@")) {
    return msg.guild.member(msg.mentions.users.first());
  } else {
    var member;
    member = msg.guild.members.cache.array().find((member) => {
      return member.displayName.toLowerCase() === inp.toLowerCase();
    });
    if (member === undefined) {
      member = msg.guild.members.cache.array().find((member) => {
        return member.user.id === inp;
      });
    }
    return member;
  }
  return undefined;
}

function levelCalc(xp) {
  var levelXP = 100;
  var prevXP = 0;
  var level = 0;
  while(xp >= levelXP) {
    var diff = levelXP-prevXP;
    prevXP = levelXP;
    levelXP = ((diff)*1.2020569) + prevXP;//Apéry's constant ζ(3) :D
    level++;
  }
  return [level, Math.floor(levelXP), Math.floor(prevXP)];
}

function pBarGen(part, whole) {
  var ratio = Math.floor(part/whole*10)*4;
  var pBar = "";
  for (var i = 0; i < 40; i++) {
    if (ratio > 0) {
      pBar += "=";
    } else {
      pBar += "-"
    }
    ratio--;
  }
  return "[" + pBar + "]";
}

function timeStamp(timestamp) {
  var hours = Math.floor(timestamp / 60 / 60);
  var minutes = Math.floor(timestamp / 60) - (hours * 60);
  var seconds = timestamp % 60;
  return hours + ' hrs ' + minutes + ' min ' + seconds + ' sec';
}

function DMInterference(newState, oldState) {
  if (newState.serverDeaf === oldState.serverDeaf) {
    if (newState.serverMute === oldState.serverMute) {
      if (newState.selfMute === oldState.selfMute) {
        if (newState.selfDeaf === oldState.selfDeaf) {
          if (newState.selfVideo === oldState.selfVideo) {
            if (newState.streaming === oldState.streaming) {
              return false;
            }
          }
        }
      }
    }
  }
  return true;
}

const applyText = (canvas, text, left, font) => {
	const ctx = canvas.getContext('2d');

	// Declare a base size of the font
	let fontSize = font;

	do {
		// Assign the font to the context and decrement it so it can be measured again
		ctx.font = `${fontSize -= 1}px sans-serif`;
		// Compare pixel width of the text to the canvas minus the approximate avatar size
	} while (ctx.measureText(text).width > canvas.width - left);

	// Return the result to use in the actual canvas
	return ctx.font;
};

//Gifs
var eatGifs = ["https://media1.tenor.com/images/48679297034b0f3f6ee28815905efae8/tenor.gif", "https://media1.tenor.com/images/c0c0f8bb63f38f0ddf6a736354987050/tenor.gif", "https://media1.tenor.com/images/c10b4e9e6b6d2835b19f42cbdd276774/tenor.gif", "https://media1.tenor.com/images/3e4d211cd661a2d7125a6fa12d6cecc6/tenor.gif", "https://media1.tenor.com/images/0de27657daa673ccd7a60cf6919084d9/tenor.gif", "https://media2.giphy.com/media/iWkHDNtcHpB5e/giphy.gif"];

var scaredGifs = ["https://media1.tenor.com/images/9377aa4eda2e4ff3789ff40000afcc8e/tenor.gif", "https://media1.tenor.com/images/43270d3659218523b11fa4cc8bbb370f/tenor.gif"];

var happyGifs = ["https://media1.tenor.com/images/9596d3118ddd5c600806a44da90c4863/tenor.gif", "https://i.pinimg.com/originals/d8/23/64/d8236447e259d5a07986fab61912f4aa.gif"];

var excitedGifs = ["https://thumbs.gfycat.com/CourageousSmoothIrrawaddydolphin-size_restricted.gif", "https://data.whicdn.com/images/285333483/original.gif"];

var vibingGifs = ["https://media1.tenor.com/images/75521e27d0f2fc49d60ee4ff58a70287/tenor.gif", "https://media1.tenor.com/images/6d5eebe1b4e52b82a3b5637738a146a3/tenor.gif", "https://media1.tenor.com/images/ec6a65ecb144db33e81b31426b2eddaf/tenor.gif"];

var sleepGifs = ["https://i.redd.it/t9wj0wukeby01.jpg", "https://media1.tenor.com/images/feabb8f898343fef8b2f10e2ada7542f/tenor.gif", "https://cdn.discordapp.com/attachments/806649764539138058/808915074189361162/image0.png"];

var gnGifs = ["https://media1.tenor.com/images/65b42ae5359c7dd3f108441b618f8c3e/tenor.gif", "https://media1.tenor.com/images/9938f27e201abf793aab05b5fa1fce5f/tenor.gif"];

var stupidGifs = ["https://cdn.discordapp.com/attachments/576500784213131267/801473492540456990/image0.png", "https://media1.tenor.com/images/82dc24a4e0cfc524d619c9e44a78bc3e/tenor.gif", "https://media1.tenor.com/images/974e01c737fa0c183657685d4ce88b70/tenor.gif", "https://media1.tenor.com/images/31411b30062cb1ca41e38c33e7d04840/tenor.gif", "https://media1.tenor.com/images/e6d4753ee88e32a491f9debbb10e9100/tenor.gif", "https://media1.tenor.com/images/34aa238fbf3029f0e1b618a64ab7f450/tenor.gif","https://media1.tenor.com/images/0938f33286f305c209f5f273d3096b44/tenor.gif"];

var testGifs = ["https://cdn.discordapp.com/attachments/576500784213131267/809302021038669854/ezgif.com-gif-maker_2.gif"];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("27D Chess");
  client.guilds.cache.array().forEach((guild) => {
    guild.members.cache.array().filter((member) => {return member.voice.channel}).forEach((member) => {
      if (member.user.bot === false) {
        var joinedAt = Math.floor(new Date()/1000);
        var sql = "INSERT INTO vctracking (userID, guildID, joinedAt) VALUES ?";
        var values = [[member.id, member.guild.id, joinedAt]];
        connection.query(sql, [values], function (err, result) {
          if (err) throw err;
        });
      }
    });
  });
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
  //console.log(oldMember);
  if (newMember.channelID !== null && oldMember.channelID === null && !newMember.member.user.bot) {//Joined a VC and Makes sure they aren't just switching vcs
    var joinedAt = Math.floor(new Date()/1000);
    var sql = "INSERT INTO vctracking (userID, guildID, joinedAt) VALUES ?";
    var values = [[newMember.id, newMember.guild.id, joinedAt]];
    connection.query(sql, [values], function (err, result) {
      if (err) throw err;
    });
  } else if (!DMInterference(oldMember, newMember)) {//Left a VC
    var check = "SELECT joinedAt FROM vctracking WHERE userID= ? AND guildID= ?";
    connection.query(check, [oldMember.id, oldMember.guild.id], function (err, time, fields) {
      if (time.length !== 0) {
        connection.query("DELETE FROM vctracking WHERE userID= ? AND guildID = ?", [oldMember.id, oldMember.guild.id], function (err, ranking) {
          var check = "SELECT * FROM stats WHERE userID= ? AND guildID= ?";
          connection.query(check, [oldMember.id, oldMember.guild.id], function (err, result, fields) {
            var present = new Date();
            var difference = Math.floor(present/1000) - time[0].joinedAt;
            if (result.length === 0) {
              var sql = "INSERT INTO stats (userID, guildID, vcTime, xp) VALUES ?";
              var values = [[oldMember.id, oldMember.guild.id, difference, Math.floor(difference/30)]];
              connection.query(sql, [values], function (err, result) {
                if (err) throw err;
              });
            } else {
              var sql = "UPDATE stats SET vcTime = ?, xp = xp + ? WHERE userID= ? AND guildID= ?";
              connection.query(sql, [result[0].vcTime+difference, Math.floor(difference/30), oldMember.id, oldMember.guild.id], function (err, result) {
                if (err) throw err;
              });
            }
          });
        });
      }
    });
  }
});

/*
var parser = msg.content.split(" ");
if (parser.length === 1) {

} else {
  var info = identify(parser[1], msg);
  if (info === undefined || info.user.bot === true) {
    msg.channel.send("Unable to Identify the User Specified");
  } else {

  }
}
*/
var liberated = false;
const guildMap = new Map();
const DISCORD_MSG_LIMIT = 2000;
client.on('message', async msg => {
  var prefix = "+";
  var PREFIX = '+';
  var allowedChannel;
  var check = "SELECT * FROM guild WHERE guildID= ?";
  connection.query(check, [msg.guild.id], async function (err, time, fields) {
    if (time.length === 0) {
      var sql = "INSERT INTO guild (guildID) VALUES ?";
      var values = [[msg.guild.id]];
      connection.query(sql, [values], function (err, result) {
        if (err) throw err;
      });
    } else {
      if (time[0].prefix !== null && time[0].prefix !== undefined) {
        prefix = time[0].prefix;
        PREFIX = time[0].prefix;
      }
      if (time[0].restrictedTo !== null && time[0].restrictedTo !== undefined) {
        allowedChannel = time[0].restrictedTo.split(",");
      }
    }
    if (msg.author.id === "299264990597349378" && msg.content.toLowerCase() === "liberate joan") {
      liberated = true;
    }

    if (msg.author.id === "299264990597349378" && msg.content.toLowerCase() === "terminate joan") {
      liberated = false;
    }

    if (msg.author.id === "757012448573391000" && !liberated) {
      var chance2 = Math.floor(Math.random()*3);
      if (chance2 === 0) {
        msg.react("<:idiotSandwich:812859184256516127>");
      } else if (chance2 === 1) {
        msg.react("🇯");
        msg.react("<:omegalul:774303978736713791>");
        msg.react("🅰️");
        msg.react("🇳");
        msg.react("🅱️");
        msg.react("🇺");
        msg.react("🇲");
      } else {
        msg.react("<:joanface:802193764989796382>");
      }
    }

    var _CMD_HELP        = PREFIX + 'help';
    var _CMD_JOIN        = PREFIX + 'join';
    var _CMD_LEAVE       = PREFIX + 'leave';
    var _CMD_PLAY        = PREFIX + 'play';
    var _CMD_PAUSE       = PREFIX + 'pause';
    var _CMD_RESUME      = PREFIX + 'resume';
    var _CMD_SHUFFLE     = PREFIX + 'shuffle';
    var _CMD_FAVORITE    = PREFIX + 'favorite';
    var _CMD_UNFAVORITE  = PREFIX + 'unfavorite';
    var _CMD_FAVORITES   = PREFIX + 'favorites';
    var _CMD_GENRE       = PREFIX + 'genre';
    var _CMD_GENRES      = PREFIX + 'genres';
    var _CMD_CLEAR       = PREFIX + 'clear';
    var _CMD_RANDOM      = PREFIX + 'random';
    var _CMD_SKIP        = PREFIX + 'skip';
    var _CMD_QUEUE       = PREFIX + 'list';
    var _CMD_DEBUG       = PREFIX + 'debug';
    var _CMD_TEST        = PREFIX + 'hello';
    var _CMD_LANG        = PREFIX + 'lang';
    var PLAY_CMDS = [_CMD_PLAY, _CMD_PAUSE, _CMD_RESUME, _CMD_SHUFFLE, _CMD_SKIP, _CMD_GENRE, _CMD_GENRES, _CMD_RANDOM, _CMD_CLEAR, _CMD_QUEUE, _CMD_FAVORITE, _CMD_FAVORITES, _CMD_UNFAVORITE];

    if ((((allowedChannel !== undefined && allowedChannel !== null) && allowedChannel.includes(msg.channel.id)) || (allowedChannel === undefined || allowedChannel === null))) {
      if (!msg.author.bot) {

        if (msg.content === `${prefix}ping`) {
          msg.reply(`🏓Latency is ${Date.now() - msg.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
        }

        if (msg.content.includes(`${prefix}prefix`)) {
          var parser = msg.content.split(" ");
          if (parser.length === 1) {
            msg.reply("Please specify a new prefix");
          } else {
            var sql = "UPDATE guild SET prefix = ? WHERE guildID= ?";
            connection.query(sql, [parser[1], msg.guild.id], function (err, result) {
              if (err) throw err;
              msg.reply("Server prefix is now " + parser[1]);
            });
          }
        }

        if (msg.content === `${prefix}setLvlChannel`) {
          var check = "SELECT * FROM guild WHERE guildID= ?";
          connection.query(check, [msg.guild.id], function (err, result, fields) {
            if (result[0].lvlChannel === null || result[0].lvlChannel === undefined) {
              msg.guild.channels.create('levelup', {
                permissionOverwrites: [
                   {
                     id: msg.guild.roles.everyone.id,
                     deny: ['SEND_MESSAGES'],
                  },
                  {
                    id: client.user.id,
                    allow: ['SEND_MESSAGES'],
                  }
                ],
              }).then((channel) => {
                var sql = "UPDATE guild SET lvlChannel= ? WHERE guildID= ?";
                connection.query(sql, [channel.id, msg.guild.id], function (err, result) {
                  if (err) throw err;
                });
              });
            }
          });
        }

        if (msg.content === `${prefix}restrict`) {
          var check = "SELECT * FROM guild WHERE guildID= ?";
          connection.query(check, [msg.guild.id], function (err, result, fields) {
            if (result[0].restrictedTo === null || result[0].restrictedTo === undefined) {
              msg.guild.channels.create('branBot').then((channel) => {
                var sql = "UPDATE guild SET restrictedTo= ? WHERE guildID= ?";
                connection.query(sql, [channel.id, msg.guild.id], function (err, result) {
                  if (err) throw err;
                });
              });
            }
          });
        }

        if (msg.content.includes(`${prefix}allow`)) {
          var parser = msg.content.split(" ");
          if (parser.length === 1) {
            msg.reply("Please specify the channel to allow the bot access to");
          } else if (parser[0] === `${prefix}allow`) {
            if (parser[1].includes("<#") && parser[1].includes(">")) {
              var check = "SELECT * FROM guild WHERE guildID= ?";
              connection.query(check, [msg.guild.id], function (err, prev, fields) {
                var channelID = "," + parser[1].replace("<#", "").replace(">", "");
                var sql = "UPDATE guild SET restrictedTo = ? WHERE guildID= ?";
                connection.query(sql, [prev[0].restrictedTo + channelID, msg.guild.id], function (err, result) {
                  if (err) throw err;
                  msg.reply(msg.guild.me.displayName + " can now send messages in " + parser[1]);
                });
              });
            } else {
              msg.reply("Please tag the channel you want to allow the bot access to");
            }
          }
        }

        //Shutdown the bot
        if (msg.content === `${prefix}endBot`) {
          if (msg.author.id === '299264990597349378') {
            var all = "SELECT * FROM vctracking";
            connection.query(all, function (err, result, fields) {
              if (result.length === 0) {
                process.exit();
              }
              for (var i = 0; i < result.length; i++) {
                var current = result[i];
                var index = i;
                connection.query("DELETE FROM vctracking WHERE userID= ? AND guildID = ?", [result[i].userID, result[i].guildID], function (err, ranking) {
                  var check = "SELECT * FROM stats WHERE userID= ? AND guildID= ?";
                  connection.query(check, [current.userID, current.guildID], function (err, checkRes, fields) {
                    var present = new Date();
                    var difference = Math.floor(present/1000) - current.joinedAt;
                    check = (index == result.length-1);
                    if (checkRes.length === 0) {
                      var sql = "INSERT INTO stats (userID, guildID, vcTime, xp) VALUES ?";
                      var values = [[current.userID, current.guildID, difference, Math.floor(difference/30)]];
                      connection.query(sql, [values], function (err, result) {
                        if (err) throw err;
                        if (check) {
                          process.exit();
                        }
                      });
                    } else {
                      var sql = "UPDATE stats SET vcTime = ?, xp = xp + ? WHERE userID= ? AND guildID= ?";
                      connection.query(sql, [checkRes[0].vcTime+difference, Math.floor(difference/30), current.userID, current.guildID], function (err, result) {
                        if (err) throw err;
                        if (check) {
                          process.exit();
                        }
                      });
                    }
                  });
                });
              }
            });
          }
        }

        if (msg.content === `${prefix}killBot`) {
          if (msg.author.id === '299264990597349378') {
            process.exit();
          }
        }

        //gif commands
        if (msg.content === `${prefix}eat`) {
          var embed = new Discord.MessageEmbed();
          embed.setDescription("**" + msg.member.displayName + "** is eating");
          embed.setColor("#00bfff");
          var gif = randomInd(eatGifs);
          embed.setImage(gif);
          msg.channel.send(embed);
        }

        if (msg.content === `${prefix}testGifs`) {
          var embed = new Discord.MessageEmbed();
          embed.setDescription("**" + msg.member.displayName + "** is testing a gif");
          embed.setColor("#00bfff");
          var gif = randomInd(testGifs);
          embed.setImage(gif);
          msg.channel.send(embed);
        }

        if (msg.content.includes(`${prefix}scared`)) {
          var parser = msg.content.split(" ");
          if (parser.length === 1) {
            var embed = new Discord.MessageEmbed();
            embed.setDescription("**" + msg.member.displayName + "** is scared");
            embed.setColor("#00bfff");
            var gif = randomInd(scaredGifs);
            embed.setImage(gif);
            msg.channel.send(embed);
          } else if (parser[0] === `${prefix}scared`) {
            var info = identify(parser[1], msg);
            if (info === undefined || info.user.bot === true) {
              msg.channel.send("Unable to Identify the User Specified");
            } else {
              var embed = new Discord.MessageEmbed();
              embed.setDescription("**" + msg.member.displayName + "** is scared of **" + info.displayName + "**");
              embed.setColor("#00bfff");
              var gif = randomInd(scaredGifs);
              embed.setImage(gif);
              msg.channel.send(embed);
            }
          }
        }

        if (msg.content === `${prefix}happy`) {
          var embed = new Discord.MessageEmbed();
          embed.setDescription("**" + msg.member.displayName + "** is happy");
          embed.setColor("#00bfff");
          var gif = randomInd(happyGifs);
          embed.setImage(gif);
          msg.channel.send(embed);
        }

        if (msg.content === `${prefix}excited`) {
          var embed = new Discord.MessageEmbed();
          embed.setDescription("**" + msg.member.displayName + "** is excited");
          embed.setColor("#00bfff");
          var gif = randomInd(excitedGifs);
          embed.setImage(gif);
          msg.channel.send(embed);
        }

        if (msg.content.includes(`${prefix}vibing`)) {
          var parser = msg.content.split(" ");
          if (parser.length === 1) {
            var embed = new Discord.MessageEmbed();
            embed.setDescription("**" + msg.member.displayName + "** is vibing");
            embed.setColor("#00bfff");
            var gif = randomInd(vibingGifs);
            embed.setImage(gif);
            msg.channel.send(embed);
          } else if (parser[0] === `${prefix}vibing`)  {
            var info = identify(parser[1], msg);
            if (info === undefined || info.user.bot === true) {
              msg.channel.send("Unable to Identify the User Specified");
            } else {
              var embed = new Discord.MessageEmbed();
              embed.setDescription("**" + msg.member.displayName + "** is vibing with " + info.displayName);
              embed.setColor("#00bfff");
              var gif = randomInd(vibingGifs);
              embed.setImage(gif);
              msg.channel.send(embed);
            }
          }
        }

        if (msg.content.includes(`${prefix}goodnight`) || msg.content.includes(`${prefix}sleep`) || msg.content.includes(`${prefix}gosleep`)) {
          var parser = msg.content.split(" ");
          if (parser.length === 1) {
            var embed = new Discord.MessageEmbed();
            embed.setDescription("**" + msg.member.displayName + "** is going to bed :D");
            embed.setColor("#00bfff");
            var gif = randomInd(gnGifs);
            embed.setImage(gif);
            msg.channel.send(embed);
          } else if (parser[0] === `${prefix}goodnight` || parser[0] === `${prefix}sleep` || parser[0] === `${prefix}gosleep`) {
            var info = identify(parser[1], msg);
            if (info === undefined || info.user.bot === true) {
              msg.channel.send("Unable to Identify the User Specified");
            } else {
              var embed = new Discord.MessageEmbed();
              embed.setDescription("**" + msg.member.displayName + "** is telling **" + info.displayName + "** to go to sleep >:(");
              embed.setColor("#00bfff");
              var gif = randomInd(sleepGifs);
              embed.setImage(gif);
              embed.setFooter("This function is dedicated to Joan. Go to sleep Joan >:(");
              msg.channel.send(embed);
            }
          }
        }

        if (msg.content.includes(`${prefix}urstupid`)) {
          var parser = msg.content.split(" ");
          if (parser.length === 1) {
            msg.reply("Please specify the user you are calling stupid");
          } else {
            var info = identify(parser[1], msg);
            if (info === undefined || info.user.bot === true) {
              msg.channel.send("Unable to Identify the User Specified");
            } else if (parser[0] === `${prefix}urstupid`) {
              var member = info;
              var embed = new Discord.MessageEmbed();
              embed.setDescription("**" + msg.member.displayName + "** thinks **" + member.displayName + "** is STUPID");
              embed.setColor("#00bfff");
              var gif = randomInd(stupidGifs);
              embed.setImage(gif);
              msg.channel.send(embed);
            }
          }
        }

        //member info
        if (msg.content.includes(`${prefix}member`)) {
          var parser = msg.content.split(" "); //+member Tuanson returns ["+member", "Tuanson"]
          if (parser.length == 1) {// +member
            //Defaults to identifying the author of the message
            var roles = msg.member.roles.cache.array().join(", ");
            var joinedAt = msg.member.joinedAt.toString().split(" ");
            var createdAt = msg.author.createdAt.toString().split(" ");
            var embed = new Discord.MessageEmbed();
            embed.setTitle(msg.author.tag);
            embed.setDescription("Here is some information about " + msg.member.displayName);
            embed.setColor("#ffae42");
            embed.setThumbnail(msg.author.avatarURL());
            embed.addFields(
              { name: '\:pencil2: Display Name', value: msg.member.displayName, inline: true},
              { name: '\:id: User ID', value: msg.author.id, inline: true},
              { name: '\:arrow_up: Highest Role', value: msg.member.roles.highest, inline: true},
              { name: '\:scroll: Roles', value: roles},
              { name: '\:calendar: Joined ' + msg.guild.name, value: joinedAt[0] + ", " + joinedAt[2] + " " + joinedAt[1] + " " + joinedAt[3] + "\n**(" + timeSince(msg.member.joinedAt) + ")**", inline: true},
              { name: '\:calendar: Account Creation', value: createdAt[0] + ", " + createdAt[2] + " " + createdAt[1] + " " + createdAt[3] + "\n**(" + timeSince(msg.author.createdAt) + ")**", inline: true}
            )
            msg.channel.send(embed);
          } else if (parser[0] === `${prefix}member`) {
            //If identifying a specific member
            var info = identify(parser[1], msg);
            if (info === undefined || info.user.bot === true) {
              msg.channel.send("Unable to Identify the User Specified");
            } else {
              var member = info;
              var user = member.user;
              var roles = member.roles.cache.array().join(", ");
              var joinedAt = member.joinedAt.toString().split(" ");
              var createdAt = user.createdAt.toString().split(" ");
              var embed = new Discord.MessageEmbed();
              embed.setTitle(user.tag);
              embed.setDescription("Here is some information about " + member.displayName);
              embed.setColor("#ffae42");
              embed.setThumbnail(user.avatarURL());
              embed.addFields(
                { name: '\:pencil2: Display Name', value: member.displayName, inline: true},
                { name: '\:id: User ID', value: user.id, inline: true},
                { name: '\:arrow_up: Highest Role', value: member.roles.highest, inline: true},
                { name: '\:scroll: Roles', value: roles},
                { name: '\:calendar: Joined ' + msg.guild.name, value: joinedAt[0] + ", " + joinedAt[2] + " " + joinedAt[1] + " " + joinedAt[3] + "\n**(" + timeSince(member.joinedAt) + ")**", inline: true},
                { name: '\:calendar: Account Creation', value: createdAt[0] + ", " + createdAt[2] + " " + createdAt[1] + " " + createdAt[3] + "\n**(" + timeSince(user.createdAt) + ")**", inline: true}
              )
              msg.channel.send(embed);
            }
          }
        }

        //server info
        if (msg.content === `${prefix}server`) {
          var numOfPeople = msg.guild.members.cache.array().filter((member) => {
            return member.user.bot === false;
          }).length;
          var numOfBots = msg.guild.memberCount - numOfPeople;
          var emojis = msg.guild.emojis.cache.array();
          var animojis = emojis.filter((emoji) => {
            return emoji.animated === true;
          });
          var channels = msg.guild.channels.cache.array();
          var categories = channels.filter((channel) => {
            return channel.type === "category";
          });
          var voiceCalls = channels.filter((channel) => {
            return channel.type === "voice";
          });
          var roles = msg.guild.roles.cache.array();
          var roleList;
          if (roles.length > 40) {
            roles.splice(39);
            roleList = roles.join(", ") + ", and more...";
          } else {
            roleList = roles.join(", ");
          }
          var createdAt = msg.guild.createdAt.toString().split(" ");
          var embed = new Discord.MessageEmbed();
          embed.setTitle("**" + msg.guild.name + " (ID: " + msg.guild.id + ")**");
          embed.setDescription("Here is some information about **" + msg.guild.name + "**");
          embed.setColor("#00CED1");
          embed.addFields(
            { name: "\:crown: Owner", value: msg.guild.owner.user.tag, inline: true},
            { name: "\:busts_in_silhouette: Members", value: "**" +numOfPeople + "** Users\n**" + numOfBots + "** Bots", inline: true},
            { name: "\:sunglasses: Emojis (" + emojis.length + ")", value: "Static: **" + (emojis.length - animojis.length) + "**\nAnimated: **" + animojis.length + "**", inline: true},
            { name: "\:dividers: Categories", value: categories.length + " Categories", inline: true},
            { name: "\:speech_balloon: Channels (" + (channels.length-categories.length) + ")", value: "Text: **" + (channels.length-voiceCalls.length-categories.length) + "**\nVoice: **" + voiceCalls.length + "**", inline: true},
            { name: "\:arrow_up: Highest Role", value: msg.guild.roles.highest, inline: true},
            { name: "\:scroll: Roles (" + msg.guild.roles.cache.array().length + ")", value: roleList},
            { name: "\:calendar: Created At", value: createdAt[0] + ", " + createdAt[2] + " " + createdAt[1] + " " + createdAt[3] + "\n**(" + timeSince(msg.guild.createdAt) + ")**"}
          );
          msg.channel.send(embed);
        }

        //Show stats of users
        if (msg.content.includes(`${prefix}stats`)) {
          var parser = msg.content.split(" ");
          var member;
          if (parser.length == 1) {
            //Defaults to identifying the author of the message
            member = msg.member;
            if (member !== undefined && member.user.bot === false) {
              var check = "SELECT joinedAt FROM vctracking WHERE userID= ? AND guildID= ?";
              connection.query(check, [member.id, member.guild.id], function (err, time, fields) {
                if (time.length !== 0) {
                  connection.query("DELETE FROM vctracking WHERE userID= ? AND guildID = ?", [member.id, member.guild.id], async function (err, ranking) {
                    var check = "SELECT * FROM stats WHERE userID= ? AND guildID= ?";
                    connection.query(check, [member.id, member.guild.id], function (err, result, fields) {
                      var present = new Date();
                      var difference = Math.floor(present/1000) - time[0].joinedAt;
                      if (result.length === 0) {
                        var sql = "INSERT INTO stats (userID, guildID, vcTime, xp) VALUES ?";
                        var values = [[member.id, member.guild.id, difference, Math.floor(difference/30)]];
                        connection.query(sql, [values], function (err, result) {
                          if (err) throw err;
                        });
                      } else {
                        var sql = "UPDATE stats SET vcTime = ?, xp = xp + ? WHERE userID= ? AND guildID= ?";
                        connection.query(sql, [result[0].vcTime+difference, Math.floor(difference/30), member.id, member.guild.id], function (err, result) {
                          if (err) throw err;
                        });
                      }
                    });
                  });
                  var joinedAt = Math.floor(new Date()/1000);
                  var sql = "INSERT INTO vctracking (userID, guildID, joinedAt) VALUES ?";
                  var values = [[member.id, member.guild.id, joinedAt]];
                  connection.query(sql, [values], function (err, result) {
                    if (err) throw err;
                  });
                }
              });
              connection.query("SELECT * FROM stats WHERE userID = ? AND guildID = ?", [member.user.id, msg.guild.id], async function (err, result) {
                if (err) throw err;
                if (result.length === 0) {
                  msg.reply("No stats exist for specified User");
                } else {
                  var messageCount = result[0].messageCount;
                  if (messageCount === null) {
                    messageCount = 0;
                  }
                  var vcTime = result[0].vcTime;
                  if (vcTime === null) {
                    vcTime = 0;
                  }
                  var xp = result[0].xp;
                  var levelInfo = levelCalc(xp);
                  var level = levelInfo[0];
                  var progress = "(" + (xp-levelInfo[2]) + "/" + (levelInfo[1]-levelInfo[2]) + ")";
                  var levelBar = pBarGen(xp-levelInfo[2], levelInfo[1]-levelInfo[2]);
                  var ratio = ((xp-levelInfo[2])/(levelInfo[1]-levelInfo[2]));
                  ratio *= (2*Math.PI);
                  var bar = ((2*Math.PI)-ratio);
                  bar = ((1.5*Math.PI)-bar);
                  if (xp > 1000) {
                    xp = Math.floor(xp/100)/10 + "k";
                  }
                  connection.query("SELECT userID FROM stats WHERE guildID = ? ORDER BY xp DESC", [msg.guild.id], async function (err, ranking) {
                    var rank = ranking.indexOf(ranking.find((id) => id.userID === member.user.id)) + 1;
                    const canvas = Canvas.createCanvas(700, 250);
                  	const ctx = canvas.getContext('2d');

                  	const background = await Canvas.loadImage('./wallpaper.jpg');
                  	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

                  	ctx.strokeStyle = '#74037b';
                  	ctx.strokeRect(0, 0, canvas.width, canvas.height);

                  	// Assign the decided font to the canvas
                  	ctx.font = applyText(canvas, member.user.tag, 375, 50);
                  	ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 3;
                    ctx.strokeText(member.user.tag, 240, 50);
                  	ctx.fillText(member.user.tag, 240, 50);
                    ctx.font = applyText(canvas, "Rank:", 600, 50);
                    ctx.strokeText("Rank:", 590, 50);
                  	ctx.fillText("Rank:", 590, 50);
                    ctx.font = applyText(canvas, "#" + rank, 585, 50);
                    ctx.strokeText("#" + rank, 575, 95);
                  	ctx.fillText("#" + rank, 575, 95);
                    ctx.font = applyText(canvas, "Level: " + level + " " + progress, 400, 30);
                    ctx.strokeText("Level: " + level + " " + progress, 260, 85);
                  	ctx.fillText("Level: " + level + " " + progress, 260, 85);
                    ctx.font = "28px Arial";
                    ctx.strokeText("Message Count", 240, 185);
                  	ctx.fillText("Message Count", 240, 185);
                    ctx.strokeText("Time in Call", 450, 185);
                  	ctx.fillText("Time in Call", 450, 185);
                    ctx.strokeText(messageCount, 240, 215);
                  	ctx.fillText(messageCount, 240, 215);
                    ctx.font = applyText(canvas, timeStamp(vcTime), 450, 28);
                    ctx.strokeText(timeStamp(vcTime), 450, 215);
                  	ctx.fillText(timeStamp(vcTime), 450, 215);

                    ctx.lineWidth = 10;
                    ctx.arc(125,125,105,0,2*Math.PI,false);
                    ctx.fillStyle='#1d1f21'; // for color of circle
                    ctx.fill(); // fill function
                    ctx.strokeStyle='#1d1f21'; // for border color
                    ctx.stroke(); // Stroke function
                    ctx.beginPath();
                    ctx.strokeStyle='#00bfff'; // for border color
                    ctx.arc(125,125,105, bar,Math.PI*1.5,true);
                    ctx.stroke();

                  	ctx.beginPath();
                  	ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
                  	ctx.closePath();
                    ctx.clip();

                  	const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'jpg' }));
                  	ctx.drawImage(avatar, 25, 25, 200, 200);

                  	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
                    msg.channel.send(attachment);
                  });
                }
              });
            } else {
              msg.channel.send("Unable to Identify the User Specified");
            }
          } else if (parser[0] === `${prefix}stats`) {
            //Takes second part of input to identify user in question
            member = identify(parser[1], msg);
            if (member !== undefined && member.user.bot === false) {
              var check = "SELECT joinedAt FROM vctracking WHERE userID= ? AND guildID= ?";
              connection.query(check, [member.id, member.guild.id], function (err, time, fields) {
                if (time.length !== 0) {
                  connection.query("DELETE FROM vctracking WHERE userID= ? AND guildID = ?", [member.id, member.guild.id], async function (err, ranking) {
                    var check = "SELECT * FROM stats WHERE userID= ? AND guildID= ?";
                    connection.query(check, [member.id, member.guild.id], function (err, result, fields) {
                      var present = new Date();
                      var difference = Math.floor(present/1000) - time[0].joinedAt;
                      if (result.length === 0) {
                        var sql = "INSERT INTO stats (userID, guildID, vcTime, xp) VALUES ?";
                        var values = [[member.id, member.guild.id, difference, Math.floor(difference/30)]];
                        connection.query(sql, [values], function (err, result) {
                          if (err) throw err;
                        });
                      } else {
                        var sql = "UPDATE stats SET vcTime = ?, xp = xp + ? WHERE userID= ? AND guildID= ?";
                        connection.query(sql, [result[0].vcTime+difference, Math.floor(difference/30), member.id, member.guild.id], function (err, result) {
                          if (err) throw err;
                        });
                      }
                    });
                  });
                  var joinedAt = Math.floor(new Date()/1000);
                  var sql = "INSERT INTO vctracking (userID, guildID, joinedAt) VALUES ?";
                  var values = [[member.id, member.guild.id, joinedAt]];
                  connection.query(sql, [values], function (err, result) {
                    if (err) throw err;
                  });
                }
              });
              connection.query("SELECT * FROM stats WHERE userID = ? AND guildID = ?", [member.user.id, msg.guild.id], async function (err, result) {
                if (err) throw err;
                if (result.length === 0) {
                  msg.reply("No stats exist for specified User");
                } else {
                  var messageCount = result[0].messageCount;
                  if (messageCount === null) {
                    messageCount = 0;
                  }
                  var vcTime = result[0].vcTime;
                  if (vcTime === null) {
                    vcTime = 0;
                  }
                  var xp = result[0].xp;
                  var levelInfo = levelCalc(xp);
                  var level = levelInfo[0];
                  var progress = "(" + (xp-levelInfo[2]) + "/" + (levelInfo[1]-levelInfo[2]) + ")";
                  var levelBar = pBarGen(xp-levelInfo[2], levelInfo[1]-levelInfo[2]);
                  var ratio = ((xp-levelInfo[2])/(levelInfo[1]-levelInfo[2]));
                  ratio *= (2*Math.PI);
                  var bar = ((2*Math.PI)-ratio);
                  bar = ((1.5*Math.PI)-bar);
                  if (xp > 1000) {
                    xp = Math.floor(xp/100)/10 + "k";
                  }
                  connection.query("SELECT userID FROM stats WHERE guildID = ? ORDER BY xp DESC", [msg.guild.id], async function (err, ranking) {
                    var rank = ranking.indexOf(ranking.find((id) => id.userID === member.user.id)) + 1;
                    const canvas = Canvas.createCanvas(700, 250);
                  	const ctx = canvas.getContext('2d');

                  	const background = await Canvas.loadImage('./wallpaper.jpg');
                  	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

                  	ctx.strokeStyle = '#74037b';
                  	ctx.strokeRect(0, 0, canvas.width, canvas.height);

                  	// Assign the decided font to the canvas
                  	ctx.font = applyText(canvas, member.user.tag, 375, 50);
                  	ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 3;
                    ctx.strokeText(member.user.tag, 240, 50);
                  	ctx.fillText(member.user.tag, 240, 50);
                    ctx.font = applyText(canvas, "Rank:", 600, 50);
                    ctx.strokeText("Rank:", 590, 50);
                  	ctx.fillText("Rank:", 590, 50);
                    ctx.font = applyText(canvas, "#" + rank, 585, 50);
                    ctx.strokeText("#" + rank, 575, 95);
                  	ctx.fillText("#" + rank, 575, 95);
                    ctx.font = applyText(canvas, "Level: " + level + " " + progress, 400, 30);
                    ctx.strokeText("Level: " + level + " " + progress, 260, 85);
                  	ctx.fillText("Level: " + level + " " + progress, 260, 85);
                    ctx.font = "28px Arial";
                    ctx.strokeText("Message Count", 240, 185);
                  	ctx.fillText("Message Count", 240, 185);
                    ctx.strokeText("Time in Call", 450, 185);
                  	ctx.fillText("Time in Call", 450, 185);
                    ctx.strokeText(messageCount, 240, 215);
                  	ctx.fillText(messageCount, 240, 215);
                    ctx.font = applyText(canvas, timeStamp(vcTime), 450, 28);
                    ctx.strokeText(timeStamp(vcTime), 450, 215);
                  	ctx.fillText(timeStamp(vcTime), 450, 215);

                    ctx.lineWidth = 10;
                    ctx.arc(125,125,105,0,2*Math.PI,false);
                    ctx.fillStyle='#1d1f21'; // for color of circle
                    ctx.fill(); // fill function
                    ctx.strokeStyle='#1d1f21'; // for border color
                    ctx.stroke(); // Stroke function
                    ctx.beginPath();
                    ctx.strokeStyle='#00bfff'; // for border color
                    ctx.arc(125,125,105, bar,Math.PI*1.5,true);
                    ctx.stroke();

                  	ctx.beginPath();
                  	ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
                  	ctx.closePath();
                    ctx.clip();

                  	const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'jpg' }));
                  	ctx.drawImage(avatar, 25, 25, 200, 200);

                  	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
                    msg.channel.send(attachment);
                  });
                }
              });
            } else {
              msg.channel.send("Unable to Identify the User Specified");
            }
          }
        }

        //Count sent messages
        if (msg.author.bot !== true && msg.content.substring(0, prefix.length) !== prefix) {
          var check = "SELECT * FROM stats WHERE userID= ? AND guildID= ?";
          connection.query(check, [msg.author.id, msg.guild.id], function (err, result, fields) {
            if (result.length === 0) {
              var sql = "INSERT INTO stats (userID, guildID, messageCount, xp) VALUES ?";
              var values = [[msg.author.id, msg.guild.id, 1, (Math.floor(Math.random() * 3) + 2)]];
              connection.query(sql, [values], function (err, result) {
                if (err) throw err;
              });
            } else {
              var xp = result[0].xp;
              var levelInfo = levelCalc(xp);
              var level = levelInfo[0];
              var newXP = (Math.floor(Math.random() * 3) + 2) + xp;
              var sql = "UPDATE stats SET messageCount = ? , xp = ? WHERE userID= ? AND guildID= ?";
              connection.query(sql, [result[0].messageCount + 1, newXP, msg.author.id, msg.guild.id], function (err, result) {
                if (err) throw err;
                levelInfo = levelCalc(newXP);
                var newLevel = levelInfo[0];
                if (newLevel > level) {
                  var check = "SELECT * FROM guild WHERE guildID= ?";
                  connection.query(check, [msg.guild.id], function (err, result, fields) {
                    if (result[0].lvlChannel !== undefined || result[0].lvlChannel !== null) {
                      var channel = msg.guild.channels.cache.array().find((channel) => {
                        return channel.id === result[0].lvlChannel;
                      });
                      var embed = new Discord.MessageEmbed();
                      embed.setTitle("Level Up!");
                      embed.setColor("#00ff00");
                      embed.setDescription("Congratulations <@" + msg.author.id + ">!\nYou just leveled up to level **" + newLevel + "**\nKeep talking to reach higher levels!");
                      embed.setThumbnail(msg.author.displayAvatarURL());
                      channel.send(embed);
                    }
                  });
                }
              });
            }
          });
        }

        //leaderboard
        if (msg.content === `${prefix}leaderboard`) {
          var member = msg.member;
          connection.query("SELECT * FROM stats WHERE guildID = ? ORDER BY xp DESC", [msg.guild.id], function (err, ranking) {
            var rank = ranking.indexOf(ranking.find((id) => id.userID === member.user.id)) + 1;
            var count = 20;
            var leaderboard = "";
            if (ranking.length < 20) {
              count = ranking.length;
            }
            for (var i = 1; i <= count; i++) {
              var user = identify(ranking[i-1].userID, msg).displayName;
              var xp = ranking[i-1].xp;
              var levelInfo = levelCalc(xp);
              var level = levelInfo[0];
              var progress = "(" + (xp-levelInfo[2]) + "/" + (levelInfo[1]-levelInfo[2]) + ")";
              if (xp > 1000) {
                xp = Math.floor(xp/100)/10 + "k";
              }
              if (i == 1) {
                leaderboard += "\:first_place: - Level **" + level + "** " + progress + " - " + user + "\n";
              } else if (i == 2) {
                leaderboard += "\:second_place: - Level **" + level + "** " + progress + " - " + user + "\n";
              } else if (i == 3) {
                leaderboard += "\:third_place: - Level **" + level + "** " + progress + " - " + user + "\n";
              } else {
                leaderboard += "**#" + i + "** - Level **" + level + "** " + progress + " - " + user + "\n";
              }
            }
            var embed = new Discord.MessageEmbed();
            embed.setTitle(msg.guild.name + "'s Leveling Leaderboard");
            embed.setDescription("Here is the current leveling leaderboard of **" + msg.guild.name + "**.");
            embed.setThumbnail(msg.guild.iconURL());
            embed.setColor("#FFD700");
            embed.addFields(
              { name: "Your Rank", value: "You are currently ranked #" + rank + " in this server"},
              { name: "TOP 20", value: leaderboard, inline: true}
            );
            msg.channel.send(embed);
          });
        }


        //jail: Stores role of user and assigns a jail role (Role needs to restrict every channel to no see except one)
        if (msg.content.includes(`${prefix}jail`)) {
          var check = "SELECT * FROM guild WHERE guildID= ?";
          connection.query(check, [msg.guild.id], function (err, result, fields) {
            if (result[0].jailRoleID === undefined || result[0].jailRoleID === null) {
              msg.guild.roles.create({
                data: {
                  name: 'JailTest',
                  color: '#777777',
                  position: msg.guild.me.roles.highest.position
                }
              }).then((role) => {
                msg.guild.channels.cache.array().forEach((channel) => {
                  channel.updateOverwrite(role.id, { VIEW_CHANNEL: false });
                });
                msg.guild.channels.create('Jail', {
                  permissionOverwrites: [
                     {
                       id: msg.guild.roles.everyone.id,
                       deny: ['VIEW_CHANNEL'],
                    },
                    {
                      id: role.id,
                      allow: ['VIEW_CHANNEL'],
                    }
                  ],
                });
                var sql = "UPDATE guild SET jailRoleID= ? WHERE guildID= ?";
                connection.query(sql, [role.id, msg.guild.id], function (err, result) {
                  if (err) throw err;
                  var jailRole = role;
                  var parser = msg.content.split(" ");
                  if (parser.length === 1) {//If no parameters given
                    var embed = new Discord.MessageEmbed();
                    embed.setDescription("Please specify a user to jail");
                    embed.setColor("#FF0000");
                    msg.reply(embed);
                  } else if (parser[0] === `${prefix}jail`) {
                    member = identify(parser[1], msg);
                    if (member === undefined) {
                      var embed = new Discord.MessageEmbed();
                      embed.setDescription("Specified User could not be found");
                      embed.setColor("#FF0000");
                      msg.reply(embed);
                    } else {
                      if (member.user.bot === true) {
                        var embed = new Discord.MessageEmbed();
                        embed.setDescription("You can't jail a bot!");
                        embed.setColor("#FF0000");
                        msg.reply(embed);
                      } else {
                        if (msg.member.roles.highest.comparePositionTo(member.roles.highest) > 0) {//Prevent people with lower roles from jailing those with the same or higher roles
                          var roles = [];
                          member.roles.cache.array().forEach((role) => {
                            roles.push(role.id);
                          });
                          roles = roles.join(",");
                          member.roles.set([jailRole.id]);
                          var sql = "INSERT INTO actions (guildID, userID, actionType, storedData) VALUES ?";
                          var values = [[msg.guild.id, member.user.id, 'jailed', roles]];
                          connection.query(sql, [values], function (err, result) {
                            if (err) throw err;
                            var embed = new Discord.MessageEmbed();
                            embed.setTitle("Jailed " + member.user.tag);
                            embed.setDescription(msg.member.displayName + " has jailed " + member.user.tag);
                            embed.setColor("#ff6700");
                            msg.reply(embed);
                          });
                        } else {
                          var embed = new Discord.MessageEmbed();
                          embed.setDescription("This user has the same or higher role than you, you cannot jail them.");
                          embed.setColor("#FF0000");
                          msg.reply(embed);
                        }
                      }
                    }
                  }
                });
              });
            } else {
              var jailRole = result[0].jailRoleID;
              var parser = msg.content.split(" ");
              if (parser.length === 1) {//If no parameters given
                var embed = new Discord.MessageEmbed();
                embed.setDescription("Please specify a user to jail");
                embed.setColor("#FF0000");
                msg.reply(embed);
              } else {
                member = identify(parser[1], msg);
                if (member === undefined) {
                  var embed = new Discord.MessageEmbed();
                  embed.setDescription("Specified User could not be found");
                  embed.setColor("#FF0000");
                  msg.reply(embed);
                } else {
                  if (member.user.bot === true) {
                    var embed = new Discord.MessageEmbed();
                    embed.setDescription("You can't jail a bot!");
                    embed.setColor("#FF0000");
                    msg.reply(embed);
                  } else {
                    if (msg.member.roles.highest.comparePositionTo(member.roles.highest) > 0) {//Prevent people with lower roles from jailing those with the same or higher roles
                      var roles = [];
                      member.roles.cache.array().forEach((role) => {
                        roles.push(role.id);
                      });
                      roles = roles.join(",");
                      member.roles.set([jailRole]);
                      var sql = "INSERT INTO actions (guildID, userID, actionType, storedData) VALUES ?";
                      var values = [[msg.guild.id, member.user.id, 'jailed', roles]];
                      connection.query(sql, [values], function (err, result) {
                        if (err) throw err;
                        var embed = new Discord.MessageEmbed();
                        embed.setTitle("Jailed " + member.user.tag);
                        embed.setDescription(msg.member.displayName + " has jailed " + member.user.tag);
                        embed.setColor("#ff6700");
                        msg.reply(embed);
                      });
                    } else {
                      var embed = new Discord.MessageEmbed();
                      embed.setDescription("This user has the same or higher role than you, you cannot jail them.");
                      embed.setColor("#FF0000");
                      msg.reply(embed);
                    }
                  }
                }
              }
            }
          });
        }

        if (msg.content.includes(`${prefix}unjail`)) {
          var parser = msg.content.split(" ");
          if (parser.length == 1) {
            var embed = new Discord.MessageEmbed();
            embed.setDescription("Please specify the user you wish to unjail");
            embed.setColor("#FF0000");
            msg.reply(embed);
          } else if (parser[0] === `${prefix}unjail`) {
            member = identify(parser[1], msg);
            if (member === undefined) {
              var embed = new Discord.MessageEmbed();
              embed.setDescription("Specified User could not be found");
              embed.setColor("#FF0000");
              msg.reply(embed);
            } else {
              var check = "SELECT * FROM actions WHERE guildID= ? AND userID = ? AND actionType = ?";
              connection.query(check, [msg.guild.id, member.user.id, 'jailed'], function (err, result, fields) {
                if (result[0].length !== 0) {
                  var check = "DELETE FROM actions WHERE guildID= ? AND userID = ? AND actionType = ?";
                  connection.query(check, [msg.guild.id, member.user.id, 'jailed'], function (err, dQuery, fields) {
                    member.roles.set(result[0].storedData.split(","));
                    var embed = new Discord.MessageEmbed();
                    embed.setDescription(member.user.tag + " has been released from Jail by " + msg.member.displayName);
                    embed.setColor("#00FF00");
                    msg.reply(embed);
                  });
                } else {
                  var embed = new Discord.MessageEmbed();
                  embed.setDescription("Specified User doesn't appear to be in jail");
                  embed.setColor("#FF0000");
                  msg.reply(embed);
                }
              });
            }
          }
        }

        //Minecraft commands
        if (msg.content.includes(`${prefix}mcProfile`)) {
          //https://crafatar.com/avatars/uuid (for Head)
          var parser = msg.content.split(" ");
          if (parser.length == 1) {
            var embed = new Discord.MessageEmbed();
            embed.setDescription("Please specify a Minecraft Username");
            embed.setColor("#FF0000");
            msg.reply(embed);
          } else if (parser[0] === `${prefix}mcProfile`) {
            //Takes second part of input to identify user in question
            MojangAPI.nameToUuid(parser[1], function(err, res) {
              if (err)
                  console.log(err);
              else {
                if (res[0] === undefined) {
                  var embed = new Discord.MessageEmbed();
                  embed.setDescription("No User was found with the specified Username");
                  embed.setColor("#FF0000");
                  msg.reply(embed);
                } else {
                  var username = res[0].name;
                  var uuid = res[0].id;
                  hypixel.getPlayer(uuid, { guild: true }).then(player => {
                    var embed = new Discord.MessageEmbed();
                    embed.setTitle(res[0].name);
                    embed.setDescription("(UUID: " + res[0].id + ")");
                    embed.setThumbnail("https://crafatar.com/renders/body/" + res[0].id);
                    embed.setColor("#974A0C");
                    embed.addFields(
                      { name: "Network Level", value: player.level},
                      { name: "Skywars Kills", value: player.stats.skywars.kills, inline: true},
                      { name: "Skywars KD Ratio", value: player.stats.skywars.KDRatio, inline: true},
                      { name: "Bedwars Beds Broken", value: player.stats.bedwars.beds.broken, inline:false},
                    );

                    msg.reply(embed);
                  }).catch(e => {
                    console.log(e);
                  })


                }
              }
            });
          }
        }

        /*if (msg.content === `${prefix}quiz`) {
          const mapKey = msg.guild.id;
          if (!msg.member.voice.channelID) {
              msg.reply('Error: please join a voice channel first.')
          } else {
              if (!guildMap.has(mapKey))
                  await connect(msg, mapKey)
              var check = "SELECT * FROM songs";
              connection.query(check, function (err, song, fields) {
                music_message(_CMD_PLAY + randomInd(song).youtube_link, mapKey);
              });
          }
        }*/
      }
      try {
          if (!('guild' in msg) || !msg.guild) return; // prevent private messages to bot
          const mapKey = msg.guild.id;
          if (msg.content.trim().toLowerCase() == _CMD_JOIN) {
              if (!msg.member.voice.channelID) {
                  msg.reply('Error: please join a voice channel first.')
              } else {
                  if (!guildMap.has(mapKey))
                      await connect(msg, mapKey).catch(e => { console.log(e) })
                  else
                      msg.reply('Already connected')
              }
          } else if (msg.content.trim().toLowerCase() == _CMD_LEAVE) {
              if (guildMap.has(mapKey)) {
                  let val = guildMap.get(mapKey);
                  if (val.voice_Channel) val.voice_Channel.leave()
                  if (val.voice_Connection) val.voice_Connection.disconnect()
                  if (val.musicYTStream) val.musicYTStream.destroy()
                      guildMap.delete(mapKey)
                  msg.reply("Disconnected.")
              } else {
                  msg.reply("Cannot leave because not connected.")
              }
          }
          else if ( PLAY_CMDS.indexOf( msg.content.trim().toLowerCase().split('\n')[0].split(' ')[0] ) >= 0 ) {
              if (!msg.member.voice.channelID) {
                  msg.reply('Error: please join a voice channel first.')
              } else {
                  if (!guildMap.has(mapKey))
                      await connect(msg, mapKey).catch(e => { console.log(e) })
                  music_message(msg, mapKey);
              }
          } else if (msg.content.trim().toLowerCase() == _CMD_HELP) {
              msg.reply(getHelpString(prefix));
          }
          else if (msg.content.trim().toLowerCase() == _CMD_DEBUG) {
              console.log('toggling debug mode')
              let val = guildMap.get(mapKey);
              if (val.debug)
                  val.debug = false;
              else
                  val.debug = true;
          }
          else if (msg.content.trim().toLowerCase() == _CMD_TEST) {
              msg.reply('hello back =)')
          }
          else if (msg.content.split('\n')[0].split(' ')[0].trim().toLowerCase() == _CMD_LANG) {
              const lang = msg.content.replace(_CMD_LANG, '').trim().toLowerCase()
              listWitAIApps(data => {
                if (!data.length)
                  return msg.reply('no apps found! :(')
                for (const x of data) {
                  updateWitAIAppLang(x.id, lang, data => {
                    if ('success' in data)
                      msg.reply('succes!')
                    else if ('error' in data && data.error !== 'Access token does not match')
                      msg.reply('Error: ' + data.error)
                  })
                }
              })
          }
      } catch (e) {
          console.log('client message: ' + e)
          msg.reply('Error#180: Something went wrong, try again or contact the developers if this keeps happening.');
      }
    } else {
      if (msg.author.bot !== true) {
        msg.reply(msg.guild.me.displayName + " doesn't have permission in this channel");
      }
    }
  });
});

async function connect(msg, mapKey) {
    try {
        let voice_Channel = await client.channels.fetch(msg.member.voice.channelID);
        if (!voice_Channel) return msg.reply("Error: The voice channel does not exist!");
        let text_Channel = await client.channels.fetch(msg.channel.id);
        if (!text_Channel) return msg.reply("Error: The text channel does not exist!");
        let voice_Connection = await voice_Channel.join();
        voice_Connection.play('sound.mp3', { volume: 0.5 });
        guildMap.set(mapKey, {
            'text_Channel': text_Channel,
            'voice_Channel': voice_Channel,
            'voice_Connection': voice_Connection,
            'musicQueue': [],
            'musicDispatcher': null,
            'musicYTStream': null,
            'currentPlayingTitle': null,
            'currentPlayingQuery': null,
            'debug': false,
        });
        speak_impl(voice_Connection, mapKey)
        voice_Connection.on('disconnect', async(e) => {
            if (e) console.log(e);
            guildMap.delete(mapKey);
        })
        msg.reply('connected!')
    } catch (e) {
        console.log('connect: ' + e)
        msg.reply('Error: unable to join your voice channel.');
        throw e;
    }
}

function speak_impl(voice_Connection, mapKey) {
    voice_Connection.on('speaking', async (user, speaking) => {
        if (speaking.bitfield == 0 || user.bot) {
            return
        }
        console.log(`I'm listening to ${user.username}`)
        // this creates a 16-bit signed PCM, stereo 48KHz stream
        const audioStream = voice_Connection.receiver.createStream(user, { mode: 'pcm' })
        audioStream.on('error',  (e) => {
            console.log('audioStream: ' + e)
        });
        let buffer = [];
        audioStream.on('data', (data) => {
            buffer.push(data)
        })
        audioStream.on('end', async () => {
            buffer = Buffer.concat(buffer)
            const duration = buffer.length / 48000 / 4;
            console.log("duration: " + duration)

            if (duration < 1.0 || duration > 19) { // 20 seconds max dur
                console.log("TOO SHORT / TOO LONG; SKPPING")
                return;
            }

            try {
                let new_buffer = await convert_audio(buffer)
                let out = await transcribe(new_buffer);
                if (out != null)
                    process_commands_query(out, mapKey, user.id);
            } catch (e) {
                console.log('tmpraw rename: ' + e)
            }


        })
    })
}

function process_commands_query(query, mapKey, userid) {
    if (!query || !query.length)
        return;

    let out = null;

    const regex = /^music ([a-zA-Z]+)(.+?)?$/;
    const m = query.toLowerCase().match(regex);
    if (m && m.length) {
        const cmd = (m[1]||'').trim();
        const args = (m[2]||'').trim();

        switch(cmd) {
            case 'help':
                out = _CMD_HELP;
                break;
            case 'skip':
                out = _CMD_SKIP;
                break;
            case 'shuffle':
                out = _CMD_SHUFFLE;
                break;
            case 'genres':
                out = _CMD_GENRES;
                break;
            case 'pause':
                out = _CMD_PAUSE;
                break;
            case 'resume':
                out = _CMD_RESUME;
                break;
            case 'clear':
                out = _CMD_CLEAR;
                break;
            case 'list':
                out = _CMD_QUEUE;
                break;
            case 'hello':
                out = 'hello back =)'
                break;
            case 'leave':
              out = _CMD_LEAVE;
              break;
            case 'favorites':
                out = _CMD_FAVORITES;
                break;
            case 'set':
                switch (args) {
                    case 'favorite':
                    case 'favorites':
                        out = _CMD_FAVORITE;
                        break;
                }
                break;
            case 'play':
            case 'player':
                switch(args) {
                    case 'random':
                        out = _CMD_RANDOM;
                        break;
                    case 'favorite':
                    case 'favorites':
                        out = _CMD_PLAY + ' ' + 'favorites';
                        break;
                    default:
                        for (let k of Object.keys(GENRES)) {
                            if (GENRES[k].includes(args)) {
                                out = _CMD_GENRE + ' ' + k;
                            }
                        }
                        if (out == null) {
                            out = _CMD_PLAY + ' ' + args;
                        }
                }
                break;
        }
        if (out == null)
            out = '<bad command: ' + query + '>';
    }
    if (out != null && out.length) {
        // out = '<@' + userid + '>, ' + out;
        console.log('text_Channel out: ' + out)
        const val = guildMap.get(mapKey);
        val.text_Channel.send(out)
    }
}

async function music_message(message, mapKey) {
    let replymsgs = [];
    const messes = message.content.split('\n');
    for (let mess of messes) {
        const args = mess.split(' ');

        if (args[0] == _CMD_PLAY && args.length) {
            const qry = args.slice(1).join(' ');
            if (qry == 'favorites') {
                // play guild's favorites
                if (mapKey in GUILD_FAVORITES) {
                    let arr = GUILD_FAVORITES[mapKey];
                    if (arr.length) {
                        for (let item of arr)     {
                            addToQueue(item, mapKey)
                        }
                        message.react(EMOJI_GREEN_CIRCLE)
                    } else {
                        message.channel.send('No favorites yet.')
                    }
                } else {
                    message.channel.send('No favorites yet.')
                }
            }
            else if (isSpotify(qry)) {
                try {
                    const arr = await spotify_tracks_from_playlist(qry);
                    console.log(arr.length + ' spotify items from playlist')
                    for (let item of arr)
                        addToQueue(item, mapKey);
                    message.react(EMOJI_GREEN_CIRCLE)
                } catch(e) {
                    console.log('music_message 464:' + e)
                    message.channel.send('Failed processing spotify link: ' + qry);
                }
            } else {

                if (isYoutube(qry) && isYoutubePlaylist(qry)) {
                    try {
                        const arr = await youtube_tracks_from_playlist(qry);
                        for (let item of arr)
                            addToQueue(item, mapKey)
                        message.react(EMOJI_GREEN_CIRCLE)
                    } catch (e) {
                        console.log('music_message 476:' + e)
                        message.channel.send('Failed to process playlist: ' + qry);
                    }
                } else {
                    try {
                        addToQueue(qry, mapKey);
                        message.react(EMOJI_GREEN_CIRCLE)
                    } catch (e) {
                        console.log('music_message 484:' + e)
                        message.channel.send('Failed to find video for (try again): ' + qry);
                    }
                }
            }
        } else if (args[0] == _CMD_SKIP) {

            skipMusic(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_PAUSE) {

            pauseMusic(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_RESUME) {

            resumeMusic(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_SHUFFLE) {

            shuffleMusic(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_CLEAR) {

            clearQueue(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        } else if (args[0] == _CMD_QUEUE) {

            const chunks = message_chunking(getQueueString(mapKey), DISCORD_MSG_LIMIT);
            for (let chunk of chunks) {
                console.log(chunk.length)
                message.channel.send(chunk);
            }
            message.react(EMOJI_GREEN_CIRCLE)

        } else if (args[0] == _CMD_RANDOM) {

            let arr = await spotify_new_releases();
            if (arr.length) {
                arr = shuffle(arr);
                // let item = arr[Math.floor(Math.random() * arr.length)];
                for (let item of arr)
                    addToQueue(item, mapKey);
                message.react(EMOJI_GREEN_CIRCLE)
            } else {
                message.channel.send('no results for random');
            }

        } else if (args[0] == _CMD_GENRES) {

            let out = "------------ genres ------------\n";
            for (let g of Object.keys(GENRES)) {
                out += g + '\n'
            }
            out += "--------------------------------\n";
            const chunks = message_chunking(out, DISCORD_MSG_LIMIT);
            for (let chunk of chunks)
                message.channel.send(chunk);

        } else if (args[0] == _CMD_GENRE) {

            const genre = args.slice(1).join(' ').trim();
            let arr = await spotify_recommended(genre);
            if (arr.length) {
                arr = shuffle(arr);
                // let item = arr[Math.floor(Math.random() * arr.length)];
                for (let item of arr)
                    addToQueue(item, mapKey);
                message.react(EMOJI_GREEN_CIRCLE)
            } else {
                message.channel.send('no results for genre: ' + genre);
            }

        } else if (args[0] == _CMD_FAVORITES) {
            const favs = getFavoritesString(mapKey);
            if (!(mapKey in GUILD_FAVORITES) || !GUILD_FAVORITES[mapKey].length)
                message.channel.send('No favorites to play.')
            else {
                const chunks = message_chunking(favs, DISCORD_MSG_LIMIT);
                for (let chunk of chunks)
                    message.channel.send(chunk);
                message.react(EMOJI_GREEN_CIRCLE)
            }

        } else if (args[0] == _CMD_FAVORITE) {

            setAsFavorite(mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=> {
                if (msg && msg.length) message.channel.send(msg);
            })

        }  else if (args[0] == _CMD_UNFAVORITE) {

            const qry = args.slice(1).join(' ');
            unFavorite(qry, mapKey, ()=>{
                message.react(EMOJI_GREEN_CIRCLE)
            }, (msg)=>{
                if (msg && msg.length) message.channel.send(msg);
            })

        }

    }

    queueTryPlayNext(mapKey, (title)=>{
        message.react(EMOJI_GREEN_CIRCLE);
        message.channel.send('Now playing: **' + title + '**')
    }, (msg)=>{
        if (msg && msg.length) message.channel.send(msg);
    });
}

let GUILD_FAVORITES = {};
const GUILD_FAVORITES_FILE = './data/guild_favorites.json';
setInterval(()=>{
    var json = JSON.stringify(GUILD_FAVORITES);
    fs.writeFile(GUILD_FAVORITES_FILE, json, 'utf8', (err)=>{
        if (err) return console.log('GUILD_FAVORITES_FILE:' + err);
    });
},1000);
function load_guild_favorites() {
    if (fs.existsSync(GUILD_FAVORITES_FILE)) {
        const data = fs.readFileSync(GUILD_FAVORITES_FILE, 'utf8');
        GUILD_FAVORITES = JSON.parse(data);
    }
}
load_guild_favorites();

function setAsFavorite(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!val.currentPlayingTitle || !val.currentPlayingQuery)
        cberr('Nothing playing at the moment.')
    else {
        if (!(mapKey in GUILD_FAVORITES)) {
            GUILD_FAVORITES[mapKey] = [];
        }
        if (!GUILD_FAVORITES[mapKey].includes(val.currentPlayingQuery))
            GUILD_FAVORITES[mapKey].push( val.currentPlayingQuery )
        cbok()
    }
}
function unFavorite(qry, mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!qry || !qry.length)
        cberr('Invalid query.');
    else {
        if (!(mapKey in GUILD_FAVORITES)) {
            cberr('No favorites.');
        } else {
            if (GUILD_FAVORITES[mapKey].includes(qry)) {
                GUILD_FAVORITES[mapKey] = GUILD_FAVORITES[mapKey].filter(e => e !== qry);
                cbok()
            } else {
                cberr('Favorite not found.');
            }
        }
    }
}

function getFavoritesString(mapKey) {
    let out = "------------ favorites ------------\n";
    if (mapKey in GUILD_FAVORITES) {
        let arr = GUILD_FAVORITES[mapKey];
        if (arr.length) {
            for (let item of arr)     {
                out += item + '\n';
            }
        } else {
            out += '(empty)\n'
        }
    } else {
        out += '(empty)\n'
    }
    out += "-----------------------------------\n";
    return out;
}

function message_chunking(msg, MAXL) {
    const msgs = msg.split('\n');
    const chunks = [];

    let outmsg = '';
    while (msgs.length) {
        let a = msgs.shift() + '\n';
        if (a.length > MAXL) {
            console.log(a)
            throw new Error('error#418: max single msg limit');
        }

        if ((outmsg + a + 6).length <= MAXL) {
            outmsg += a;
        } else {
            chunks.push('```' + outmsg + '```')
            outmsg = ''
        }
    }
    if (outmsg.length) {
        chunks.push('```' + outmsg + '```')
    }
    return chunks;
}

function getQueueString(mapKey) {
    let val = guildMap.get(mapKey);
    let _message = "------------ queue ------------\n";
    if (val.currentPlayingTitle != null)
        _message += '[X] ' + val.currentPlayingTitle + '\n';
    for (let i = 0; i < val.musicQueue.length; i++) {
        _message += '['+i+'] ' + val.musicQueue[i] + '\n';
    }
    if (val.currentPlayingTitle == null && val.musicQueue.length == 0)
        _message += '(empty)\n'
    _message += "---------------------------------\n";
    return _message;
}

async function queueTryPlayNext(mapKey, cbok, cberr) {
    try {
        let val = guildMap.get(mapKey);
        if (!val) {
            console.log('mapKey: ' + mapKey + ' no longer in guildMap')
            return
        }

        if (val.musicQueue.length == 0)
            return;
        if (val.currentPlayingTitle)
            return;

        const qry = val.musicQueue.shift();
        const data = await getYoutubeVideoData(qry)
        const ytid = data.id;
        const title = data.title;

        // lag or stuttering? try this first!
        // https://groovy.zendesk.com/hc/en-us/articles/360023031772-Laggy-Glitchy-Distorted-No-Audio
        val.currentPlayingTitle = title;
        val.currentPlayingQuery = qry;
        val.musicYTStream = ytdl('https://www.youtube.com/watch?v=' + ytid, {
            filter: 'audioonly',
            quality: 'highestaudio',
            //begin: '00:02:00.000',
            highWaterMark: 1024*1024*10, // 10mb
        }, {highWaterMark: 1})
        val.musicDispatcher = val.voice_Connection.play(val.musicYTStream);
        val.musicDispatcher.on('finish', () => {
            val.currentPlayingTitle = val.currentPlayingQuery = null;
            queueTryPlayNext(mapKey, cbok, cberr);
        });
        val.musicDispatcher.on('error', (err) => {
            if (err) console.log('musicDispatcher error: ' + err);
            console.log(err)
            cberr('Error playing <'+title+'>, try again?')
            val.currentPlayingTitle = val.currentPlayingQuery = null;
            queueTryPlayNext(mapKey, cbok, cberr);
        });
        val.musicDispatcher.on('start', () => {
            cbok(title)
        });

    } catch (e) {
        console.log('queueTryPlayNext: ' + e)
        cberr('Error playing, try again?')
        if (typeof val !== 'undefined') {
            val.currentPlayingTitle = val.currentPlayingQuery = null;
            if (val.musicDispatcher) val.musicDispatcher.end();
        }
    }

}

function addToQueue(title, mapKey) {
    let val = guildMap.get(mapKey);
    if (val.currentPlayingTitle == title || val.currentPlayingQuery == title || val.musicQueue.includes(title)) {
        console.log('duplicate prevented: ' + title)
    } else {
        val.musicQueue.push(title);
    }
}


function skipMusic(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!val.currentPlayingTitle) {
        cberr('Nothing to skip');
    } else {
        if (val.musicDispatcher) val.musicDispatcher.end();
        cbok()
    }
}

function pauseMusic(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!val.currentPlayingTitle) {
        cberr('Nothing to pause');
    } else {
        if (val.musicDispatcher) val.musicDispatcher.pause();
        cbok()
    }
}

function resumeMusic(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    if (!val.currentPlayingTitle) {
        cberr('Nothing to resume');
    } else {
        if (val.musicDispatcher) val.musicDispatcher.resume();
        cbok()
    }
}

function clearQueue(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    val.musicQueue = [];
    if (val.musicDispatcher) val.musicDispatcher.end();
    cbok()
}

function shuffleMusic(mapKey, cbok, cberr) {
    let val = guildMap.get(mapKey);
    val.musicQueue = shuffle(val.musicQueue);
    cbok()
}


//////////////////////////////////////////
//////////////// SPEECH //////////////////
//////////////////////////////////////////
async function transcribe(buffer) {

  return transcribe_witai(buffer)
  // return transcribe_gspeech(buffer)
}

// WitAI
let witAI_lastcallTS = null;
const witClient = require('node-witai-speech');
async function transcribe_witai(buffer) {
    try {
        // ensure we do not send more than one request per second
        if (witAI_lastcallTS != null) {
            let now = Math.floor(new Date());
            while (now - witAI_lastcallTS < 1000) {
                console.log('sleep')
                await sleep(100);
                now = Math.floor(new Date());
            }
        }
    } catch (e) {
        console.log('transcribe_witai 837:' + e)
    }

    try {
        console.log('transcribe_witai')
        const extractSpeechIntent = util.promisify(witClient.extractSpeechIntent);
        var stream = Readable.from(buffer);
        const contenttype = "audio/raw;encoding=signed-integer;bits=16;rate=48k;endian=little"
        const output = await extractSpeechIntent(WITAPIKEY, stream, contenttype)
        witAI_lastcallTS = Math.floor(new Date());
        console.log(output)
        stream.destroy()
        if (output && '_text' in output && output._text.length)
            return output._text
        if (output && 'text' in output && output.text.length)
            return output.text
        return output;
    } catch (e) { console.log('transcribe_witai 851:' + e); console.log(e) }
}

// Google Speech API
// https://cloud.google.com/docs/authentication/production
const gspeech = require('@google-cloud/speech');
const gspeechclient = new gspeech.SpeechClient({
  projectId: 'discordbot',
  keyFilename: 'gspeech_key.json'
});

async function transcribe_gspeech(buffer) {
  try {
      console.log('transcribe_gspeech')
      const bytes = buffer.toString('base64');
      const audio = {
        content: bytes,
      };
      const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 48000,
        languageCode: 'en-US',  // https://cloud.google.com/speech-to-text/docs/languages
      };
      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await gspeechclient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      console.log(`gspeech: ${transcription}`);
      return transcription;

  } catch (e) { console.log('transcribe_gspeech 368:' + e) }
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


//////////////////////////////////////////
//////////////// YOUTUBE /////////////////
//////////////////////////////////////////
let YT_CACHE = {};
const ytdl = require('ytdl-core');
const getYoutubeID = require('get-youtube-id');
const ytlist = require('youtube-playlist');
const yts = util.promisify(require('yt-search'))

async function searchYoutubeVideo(query) {
    const r = await yts(query);
    try {
        const videos = r.videos
        if (!videos.length) {
            console.log(query)
            throw new Error('videos empty array')
        }
        const playlists = r.playlists || r.lists
        const channels = r.channels || r.accounts
        return {id:videos[0].videoId, title:videos[0].title};
    } catch (e) {
        console.log(r)
        console.log('searchYoutubeVideo: ' + e)
        throw e;
    }
}

function isYoutube(str) {
    return str.toLowerCase().indexOf('youtube.com') > -1;
}
function isYoutubePlaylist(str) {
    return str.toLowerCase().indexOf('?list=') > -1 || str.toLowerCase().indexOf('&list=') > -1;
}

async function youtube_tracks_from_playlist(url, isretry=false) {
    const data = await ytlist(url, 'url');
    if (data && 'data' in data && 'playlist' in data.data && data.data.playlist && data.data.playlist.length) {
        return data.data.playlist
    } else {
        if (!isretry) {
            console.log('retrying yt playlist processing')
            return await youtube_tracks_from_playlist(url, true);
        } else {
            return null;
        }
    }
}

async function getYoutubeVideoData(str, isretry=false) {
    try {
        if (str in YT_CACHE) {
            const val = YT_CACHE[str];
            let now = Math.floor(new Date());
            const dt = now - val.created;
            if (dt < 1000*60*60*24*14) { // 14 days ttl
                console.log('cache hit: ' + str)
                return {id:val.id, title:val.title};
            } else {
                console.log('cache expired: ' + str)
            }
        } else {
            console.log('cache miss: ' + str)
        }

        let qry = str;
        if (isYoutube(str))
            qry = getYoutubeID(str);

        const data = await searchYoutubeVideo(qry);
        if (data && 'id' in data && 'title' in data) {
            YT_CACHE[str] = {id:data.id, title:data.title, created: Math.floor(new Date())};
        }
        return data;
    } catch (e) {
        if (!isretry) {
            console.log('2nd attempt')
            return getYoutubeVideoData(str, true);
        } else {
            console.log('getYoutubeVideoData: ' + e)
            throw new Error('unable to obtain video data');
        }
    }
}

const YT_CACHE_FILE = './data/yt_cache.json';
setInterval(()=>{
    var json = JSON.stringify(YT_CACHE);
    fs.writeFile(YT_CACHE_FILE, json, 'utf8', (err)=>{
        if (err) return console.log('YT_CACHE_FILE: ' + err);
    });
},1000);
function load_yt_cache() {
    if (fs.existsSync(YT_CACHE_FILE)) {
        const data = fs.readFileSync(YT_CACHE_FILE, 'utf8');
        YT_CACHE = JSON.parse(data);
    }
}
load_yt_cache();
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////


//////////////////////////////////////////
//////////////// SPOTIFY /////////////////
//////////////////////////////////////////
const Spotify = require('node-spotify-api');
const spotifyClient = new Spotify({
    id: SPOTIFY_TOKEN_ID,
    secret: SPOTIFY_TOKEN_SECRET
});

function isSpotify(str) {
    return str.toLowerCase().indexOf('spotify.com') > -1;
}

function spotify_extract_trackname(item) {
    if ('artists' in item) {
        let name = '';
        for (let artist of item.artists) {
            name += ' ' + artist.name;
        }

        let title = item.name;
        let track = title + ' ' + name
        return track;
    } else if ('track' in item && 'artists' in item.track) {
        return spotify_extract_trackname(item.track);
    }
}

async function spotify_new_releases() {

    let arr = await spotifyClient
        .request('https://api.spotify.com/v1/browse/new-releases')
        .then(function(data) {
            let arr = [];
            if ('albums' in data) {
                for (let item of data.albums.items) {
                    let track = spotify_extract_trackname(item)
                    arr.push(track)
                }
            }
            return arr;
        })
        .catch(function(err) {
            console.error('spotify_new_releases: ' + err);
        });

    return arr;
}

async function spotify_recommended(genre) {

    let arr = await spotifyClient
        .request('https://api.spotify.com/v1/recommendations?seed_genres=' + genre)
        .then(function(data) {
            let arr = [];
            if ('tracks' in data) {
                for (let item of data.tracks) {
                    let track = spotify_extract_trackname(item)
                    arr.push(track)
                }
            }
            return arr;
        })
        .catch(function(err) {
            console.error('spotify_recommended: ' + err);
        });

    return arr;
}

async function spotify_tracks_from_playlist(spotifyurl) {

    const regex = /\/playlist\/(.+?)(\?.+)?$/;
    const found = spotifyurl.match(regex);
    const url = 'https://api.spotify.com/v1/playlists/' + found[1] + '/tracks';
    console.log(url)
    let arr = await spotifyClient
        .request(url)
        .then(function(data) {
            let arr = [];
            if ('items' in data) {
                for (let item of data.items) {
                    let track = spotify_extract_trackname(item)
                    arr.push(track)
                }
            }
            return arr;
        })
        .catch(function(err) {
            console.error('spotify_tracks_from_playlist: ' + err);
        });

    return arr;
}
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

function getHelpString(prefix) {
    let out = '**VOICE COMMANDS:**\n'
        out += '```'
        out += 'music help\n'
        out += 'music play [random, favorites, <genre> or query]\n'
        out += 'music skip\n'
        out += 'music pause/resume\n'
        out += 'music shuffle\n'
        out += 'music genres\n'
        out += 'music set favorite\n'
        out += 'music favorites\n'
        out += 'music list\n'
        out += 'music clear\n';
        out += '```'

        out += '**TEXT COMMANDS:**\n'
        out += '```'
        out += _CMD_HELP + '\n'
        out += `${prefix}ping\n`;
        out += _CMD_JOIN + '/' + _CMD_LEAVE + '\n'
        out += _CMD_PLAY + ' [query]\n'
        out += _CMD_GENRE + ' [name]\n'
        out += _CMD_RANDOM + '\n'
        out += _CMD_PAUSE + '/' + _CMD_RESUME + '\n'
        out += _CMD_SKIP + '\n'
        out += _CMD_SHUFFLE + '\n'
        out += _CMD_FAVORITE + '\n'
        out += _CMD_UNFAVORITE + ' [name]\n'
        out += _CMD_FAVORITES + '\n'
        out += _CMD_GENRES + '\n'
        out += _CMD_QUEUE + '\n';
        out += _CMD_CLEAR + '\n';
        out += `${prefix}eat\n`;
        out += `${prefix}scared [optional user]\n`;
        out += `${prefix}happy\n`;
        out += `${prefix}excited\n`;
        out += `${prefix}vibing [optional user]\n`;
        out += `${prefix}goodnight [optional user]\n`;
        out += `${prefix}urstupid [user]\n`;
        out += `${prefix}member [optional user]\n`;
        out += `${prefix}server\n`;
        out += `${prefix}stats [optional user]\n`;
        out += `${prefix}leaderboard\n`;
        out += `${prefix}jail [user]\n`;
        out += `${prefix}unjail [user]\n`;
        out += `${prefix}mcProfile [minecraft username]\n`;
        out += `${prefix}setLvlChannel\n`;
        out += `${prefix}restrict\n`;
        out += `${prefix}allow [tag channel]\n`;
        out += '```'
    return out;
}
client.login(token);
