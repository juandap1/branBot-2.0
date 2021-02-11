var mysql = require('mysql');
var connection = require('./connect').establishConnect();
var token = require('./token');
var MojangAPI = require('mojang-api');
const Hypixel = require('hypixel-api-reborn');
const hypixel = new Hypixel.Client('75291082-db27-4f7f-9920-d7faa17b7f51');
const Canvas = require("canvas");

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


client.on('message', async msg => {
  var check = "SELECT * FROM guild WHERE guildID= ?";
  connection.query(check, [msg.guild.id], function (err, time, fields) {
    if (time.length === 0) {
      var sql = "INSERT INTO guild (guildID) VALUES ?";
      var values = [[msg.guild.id]];
      connection.query(sql, [values], function (err, result) {
        if (err) throw err;
      });
    }
  });
  var prefix = "+";

  if (msg.content === `${prefix}ping`) {
    msg.reply("pong");
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

  if (msg.content.includes(`${prefix}scared`)) {
    var parser = msg.content.split(" ");
    if (parser.length === 1) {
      var embed = new Discord.MessageEmbed();
      embed.setDescription("**" + msg.member.displayName + "** is scared");
      embed.setColor("#00bfff");
      var gif = randomInd(scaredGifs);
      embed.setImage(gif);
      msg.channel.send(embed);
    } else {
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
    } else {
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
    } else {
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
      } else {
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
    } else {
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
    } else {
      //Takes second part of input to identify user in question
      member = identify(parser[1], msg);
    }
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
    } else {
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
    } else {
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
});

client.login(token);
