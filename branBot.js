var mysql = require('mysql');
var connection = require('./connect').establishConnect();
var token = require('./token');

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
  if (inp.includes("<@!")) {
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

function level (m, vc) {
  return 1;
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


//Gifs
var eatGifs = ["https://media1.tenor.com/images/48679297034b0f3f6ee28815905efae8/tenor.gif", "https://media1.tenor.com/images/c0c0f8bb63f38f0ddf6a736354987050/tenor.gif", "https://media1.tenor.com/images/c10b4e9e6b6d2835b19f42cbdd276774/tenor.gif", "https://media1.tenor.com/images/3e4d211cd661a2d7125a6fa12d6cecc6/tenor.gif", "https://media1.tenor.com/images/0de27657daa673ccd7a60cf6919084d9/tenor.gif", "https://media2.giphy.com/media/iWkHDNtcHpB5e/giphy.gif"];

var scaredGifs = ["https://media1.tenor.com/images/9377aa4eda2e4ff3789ff40000afcc8e/tenor.gif", "https://media1.tenor.com/images/43270d3659218523b11fa4cc8bbb370f/tenor.gif"];

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

client.on('message', msg => {

  if (msg.content === '+ping') {
    msg.reply("pong");
  }

  //Shutdown the bot
  if (msg.content === '+end') {
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

  if (msg.content === '+kill') {
    if (msg.author.id === '299264990597349378') {
      process.exit();
    }
  }

  //gif commands
  if (msg.content === '+eat') {
    var embed = new Discord.MessageEmbed();
    embed.setDescription("**" + msg.member.displayName + "** is eating");
    embed.setColor("#00bfff");
    var gif = randomInd(eatGifs);
    embed.setImage(gif);
    msg.channel.send(embed);
  }

  if (msg.content === '+scared') {
    var embed = new Discord.MessageEmbed();
    embed.setDescription("**" + msg.member.displayName + "** is scared");
    embed.setColor("#00bfff");
    var gif = randomInd(scaredGifs);
    embed.setImage(gif);
    msg.channel.send(embed);
  }



  //member info
  if (msg.content.includes('+member')) {
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
  if (msg.content === '+server') {
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
  if (msg.content.includes('+stats')) {
    var parser = msg.content.split(" ");
    var member;
    if (parser.length == 1) {
      //Defaults to identifying the author of the message
      member = msg.member;
    } else {
      //Takes second part of input to identify user in question
      member = identify(parser[1], msg);
    }
    if (member !== null && member.user.bot === false) {
      var check = "SELECT joinedAt FROM vctracking WHERE userID= ? AND guildID= ?";
      connection.query(check, [member.id, member.guild.id], function (err, time, fields) {
        if (time.length !== 0) {
          connection.query("DELETE FROM vctracking WHERE userID= ? AND guildID = ?", [member.id, member.guild.id], function (err, ranking) {
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

      connection.query("SELECT * FROM stats WHERE userID = ? AND guildID = ?", [member.user.id, msg.guild.id], function (err, result) {
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
          if (xp > 1000) {
            xp = Math.floor(xp/100)/10 + "k";
          }
          connection.query("SELECT userID FROM stats WHERE guildID = ? ORDER BY xp DESC", [msg.guild.id], function (err, ranking) {
            var rank = ranking.indexOf(ranking.find((id) => id.userID === member.user.id)) + 1;
            var embed = new Discord.MessageEmbed();
            embed.setTitle(member.user.tag);
            embed.setColor("#FFD700");
            embed.setThumbnail(member.user.avatarURL());
            embed.addFields(
              { name: "RANK", value: "#" + rank},
              { name: "Messages Sent", value: messageCount, inline: true},
              { name: "Time in Call", value: timeStamp(vcTime), inline: true},
              { name: "XP", value: xp }
            );
            msg.channel.send(embed);
          });
        }
      });
    } else {
      msg.channel.send("Unable to Identify the User Specified");
    }
  }

  //Count sent messages
  if (msg.author.bot !== true) {
    var check = "SELECT * FROM stats WHERE userID= ? AND guildID= ?";
    connection.query(check, [msg.author.id, msg.guild.id], function (err, result, fields) {
      if (result.length === 0) {
        var sql = "INSERT INTO stats (userID, guildID, messageCount, xp) VALUES ?";
        var values = [[msg.author.id, msg.guild.id, 1, (Math.floor(Math.random() * 3) + 2)]];
        connection.query(sql, [values], function (err, result) {
          if (err) throw err;
        });
      } else {
        var sql = "UPDATE stats SET messageCount = ? , xp = xp + ? WHERE userID= ? AND guildID= ?";
        connection.query(sql, [result[0].messageCount + 1, (Math.floor(Math.random() * 3) + 2), msg.author.id, msg.guild.id], function (err, result) {
          if (err) throw err;
        });
      }
    });
  }

  //leaderboard
  if (msg.content === '+leaderboard') {
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
        if (xp > 1000) {
          xp = Math.floor(xp/100)/10 + "k";
        }
        if (i == 1) {
          leaderboard += "\:first_place: " + user + " - " + xp + "\n";
        } else if (i == 2) {
          leaderboard += "\:second_place: " + user + " - " + xp + "\n";
        } else if (i == 3) {
          leaderboard += "\:third_place: " + user + " - " + xp + "\n";
        } else {
          leaderboard += i + "# " + user + " - " + xp + "\n";
        }
      }
      var embed = new Discord.MessageEmbed();
      embed.setTitle(msg.guild.name + "'s Leveling Leaderboard");
      embed.setDescription("Here is the current leveling leaderboard of **" + msg.guild.name + "**.");
      embed.setColor("#FFD700");
      embed.addFields(
        { name: "Your Rank", value: "You are currently ranked #" + rank + " in this server"},
        { name: "TOP 20", value: leaderboard, inline: true}
      );
      msg.channel.send(embed);
    });
  }

  //jail: Stores role of user and assigns a jail role (Role needs to restrict every channel to no see except one)
  /*if (msg.content.includes('+jail')) {
    var parser = msg.content.split(" ");
    if (parser.length === 0) {//If no parameters given
      var embed = new Discord.MessageEmbed();
      embed.setDescription("Please specify a user to jail");
      embed.setColor("#FF0000");
      msg.reply(embed);
    } else {
      member = identify(parser[1], msg);
      connection.query("SELECT * FROM guild WHERE guildID = ?", [msg.guild.id], function (err, guildInfo) {
        var roles = [];
        member.roles.cache.array().forEach((role) => {
          roles.push(role.id);
        });
        roles = roles.join(",");
        member.roles.set([guildInfo.jailRoleID]);
      });

    }
  }*/

});

client.login(token);
