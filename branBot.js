var mysql = require('mysql');
var connection = require('./connect').establishConnect();

/*connection.query('SELECT * FROM score', function (error, results, fields) {
    if (error)
        throw error;

    results.forEach(result => {
        console.log(result);
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
    return msg.guild.members.cache.array().filter((member) => {
      return member.displayName.toLowerCase() === inp.toLowerCase();
    })[0];
  }
  return null;
}



//Gifs
eatGifs = ["https://media1.tenor.com/images/48679297034b0f3f6ee28815905efae8/tenor.gif", "https://media1.tenor.com/images/c0c0f8bb63f38f0ddf6a736354987050/tenor.gif", "https://media1.tenor.com/images/c10b4e9e6b6d2835b19f42cbdd276774/tenor.gif", "https://media1.tenor.com/images/3e4d211cd661a2d7125a6fa12d6cecc6/tenor.gif", "https://media1.tenor.com/images/0de27657daa673ccd7a60cf6919084d9/tenor.gif", "https://media2.giphy.com/media/iWkHDNtcHpB5e/giphy.gif"];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("27D Chess");
});

/*client.on('voiceStateUpdate', (oldMember, newMember) => {
  if (newMember.channelID !== null) {
    console.log(newMember.member.displayName + " joined channel: " + newMember.channelID);
  } else {
    console.log(newMember.member.displayName + " has left: " + oldMember.channelID);
  }
});*/

client.on('message', msg => {
  if (msg.content === '+ping') {
    msg.reply("pong");
  }

  if (msg.content === '+end') {
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


  //member info
  if (msg.content.includes('+member')) {
    var parser = msg.content.split(" ");
    if (parser.length == 1) {
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
      if (info == null) {
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

  
});

client.login('NzQ0MDQwNTk4MjcyNDc1MTgw.Xzdbzg.Qtw6mSSL7k99u5lHJNMQitYcGWE');
