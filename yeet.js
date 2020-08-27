const auth = require('./auth.json');
const config = require('./config.json');
const Discord = require('discord.js');
const curl = require('curl');
var Twitter = require('twitter');
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );
const client = new Discord.Client();
var intervalList = [];
var usedRedditLinks = [];
var twitterClient = new Twitter({
    consumer_key: auth.twitter_consumer_key,
    consumer_secret: auth.twitter_consumer_secret,
    access_token_key: auth.twitter_access_token_key,
    access_token_secret: auth.twitter_access_token_secret
});

client.on('ready', () => {
    console.log('Bot wurde gestartet.');
});

client.on('message', message => {

    if (message.content.substring(0, 1) == config.commandIdentifier) {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
        args = args.splice(1);

        console.log("Befehl { " + message.content + " } wurde empfangen.");
    }

    switch (cmd) {
        case 'help':
	        console.log("Sending command list");
            message.channel.send(config.commandList);
            break;
        case 'r':
            if(args[0] == ""){ message.reply("Bitte gib ein Subreddit an."); }
            let result = sendRedditPost(message, args[0], usedRedditLinks);
            if(result != ""){ usedRedditLinks.push(result); }
            break;
        case 'getRedditList':
            sendRedditList(message, usedRedditLinks);
            break;
        case 'yeet':
            console.log("Sending: { Yote! }");
            message.channel.send('Yote!');
            break;
        case 'sidi':
            sendSidi(message, args[0], config);
            break;
        case 'cat':
            sendCatPost(message, config);
            break;
        case 'dog':
            sendDogPost(message, config);
            break;
        case 'numberfact':
            sendNumberFact(message, config);
            break;
        case 'chucknorris':
            sendChuckNorrisPost(message, config);
            break;
        case 'geekjoke':
            sendGeekJokePost(message, config);
            break;
        case 'catfacts':
            sendCatFact(message, config);
            break;
        case 'google':
            sendGoogleSearch(message, config, args);
            break;
        case 'avatar':
            sendUserAvatar(message, config);
            break;
        case "rp":
            sendRpChoice(message);
            break;
        case 'wt':
            if( config.modList.includes(message.author.id) ){ watch_twitter(message, args[0]); }
            break;
        case 'tweet':
            sendSoloTweet(message, args, twitterClient);
            break;
        case 'wm':
            if( config.modList.includes(message.author.id) ){ watchTwitterList(message, config); }
            break;
        case 'swm':
            if( config.modList.includes(message.author.id) ){ stopMemesWatcher(message, intervalList) }
            break;

   }
});


client.login(auth.token);


function watch_twitter(message, account){
    var params = {screen_name: account, count: 1, exclude_replies: true, include_rts: false};
    let thisItemLastPost = "";
    let intervalCount = 0;
    console.log( "Executing " + account + " Watcher." );
  
    intervalList.push(setInterval(function () {
      console.log(intervalCount + " wm: " + account);
      twitterClient.get('statuses/user_timeline', params, function (error, tweets, response) {
          if (!error) {
              let latestPost = "";
  
              if( tweets[0].entities.media != undefined ){
                  if( tweets[0].entities.media[0].expanded_url.includes("video/1") ){
                      latestPost += "\n" + account + ": ";
              if(tweets[0].text){
                  latestPost += "\n" + tweets[0].text + "\n";
              }
              latestPost += tweets[0].entities.media[0].expanded_url;
                  }else{
                      if ( tweets[0].entities.media[0].media_url_https ) {
                          latestPost += "\n" + account + ": ";
                  if(tweets[0].text){
                      latestPost += "\n" + tweets[0].text + "\n";
                      }
              latestPost += tweets[0].entities.media[0].media_url_https;
                      }else{
                          if (tweets.length > 0 && tweets[0].text) {
                              latestPost += "\n" + account + ": \n" + tweets[0].text;
                          }
                      }
                  }
      
  
              }else{
                  if((tweets.length > 0 && tweets[0].text) || (tweets.length > 0 && tweets[0].entities.urls)){
                      latestPost += "\n" + account + ": \n" + tweets[0].text;
                      if(tweets[0].entities.urls.expanded_url){
                          latestPost += " \n" + tweets[0].entities.urls.expanded_url;
                      }
                  }else{
                      console.log("Keine Tweets oder kein Text vorhanden");
                  }
              }
  
              if (latestPost != thisItemLastPost) {
                  message.channel.send( latestPost );
                  console.log("New Post by: " + account);
                  thisItemLastPost = latestPost;
              }
          }
      });
        intervalCount++;
    }, 60000));
}



function sendRedditPost(message, subreddit, usedRedditLinks){
    console.log("Getting post from: " + subreddit);
    message.react("🔄");
    curl.get("https://www.reddit.com/r/" + subreddit + "/new/.json?limit=50", null, (err, resp, data) => {
        if (resp && resp.statusCode == 200) {
            let rawdata = data;
            let parsedData = JSON.parse(rawdata);
            let linkList = [];
    
            if(parsedData.data.children.length > 0){
                parsedData.data.children.forEach(function(el){
                    linkList.push(el.data.url);
                })
        
                function getRandomResult(linkList){
                    return linkList[Math.floor(Math.random() * linkList.length)];
                }
        
                let randomResult = getRandomResult(linkList);
                while(usedRedditLinks.includes(randomResult)){
                    console.log("Fehler: Post wurde schonmal gesendet! Hole neuen Post.");
                    randomResult = getRandomResult(linkList);
                }
        
                console.log("Sending: { " + randomResult + " }");
                message.reactions.removeAll();
                message.channel.send(randomResult);
                return randomResult;
            }else{
                console.log("Sending: { Konnte Subreddit nicht finden. }");
                message.reactions.removeAll();
                message.channel.send("Konnte Subreddit nicht finden.");
                return "";
            }


        } else {
            console.log("error while fetching url: " + data);
            console.log("Sending: { Fehler: Entweder ist ein Netzwerk-Fehler aufgetreten oder es gibt das Subreddit nicht }");
            message.reactions.removeAll();
            message.reply("Fehler: Entweder ist ein Netzwerk-Fehler aufgetreten oder es gibt das Subreddit nicht");
            return "";
        }
    });
}



function sendRedditList(message, usedRedditLinks){
    console.log(usedRedditLinks);
    let msgString = "Schon benutzte Reddit-Links: \n";
    usedRedditLinks.forEach(function(el){
        if((msgString.length + el.length) > 2000){
            console.log("################################################");
            console.log("Reddit Liste ist zu lang, muss aufgeteilt werden");
            console.log("################################################");
            console.log("sendLength: " + msgString.length + "\n");
            message.channel.send(msgString);
            msgString = "'" + el + "'\n";
        }else{
            msgString += "'" + el + "'\n";
        }            
    });
    console.log("Sending: { " + msgString + " }");
    console.log("sendLength: " + msgString.length + "\n");
    message.channel.send(msgString);
}



function sendSidi(message, attr, config){
    let secondPart = attr.toLowerCase();
    let exceptionArray = config.exceptionArray;
    let zaehl = 0;
    while (zaehl < secondPart.length) {
        if (exceptionArray.indexOf(secondPart[0]) == -1) {
            secondPart = secondPart.substring(1);
        }
        zaehl++;
    }

    let schm = attr + ' Schm' + secondPart + ' sag ich da immer.';
    console.log("Sending: { " + schm + " }");
    message.channel.send(schm);
}



function sendCatPost(message, config){
    curl.get(config.cat_api_url, null, (err, resp, data) => {
        if (resp && resp.statusCode == 200) {
            console.log("Sending: { " + JSON.parse(data)[0].url + " }");
            message.channel.send( JSON.parse(data)[0].url );
        } else {
            console.log("error while fetching url");
        }
    });
}



function sendDogPost(message, config){
    curl.get(config.dog_api_url, null, (err, resp, data) => {
        if (resp && resp.statusCode == 200) {
            console.log("Sending: { " + JSON.parse(data)[0].url + " }");
            message.channel.send( JSON.parse(data)[0].url );
        } else {
            console.log("error while fetching url");
        }
    });
}



function sendNumberFact(message, config){
    curl.get(config.numbersapi_url, null, (err, resp, body) => {
        if (resp.statusCode == 200) {
            console.log("Sending: { " + body + " }");
            message.channel.send( body );
        } else {
            console.log("error while fetching url");
        }
    });
}



function sendChuckNorrisPost(message, config){
    curl.get(config.chucknorris_url, null, (err, resp, body) => {
        if (resp.statusCode == 200) {
            console.log("Sending: { " + JSON.parse(body).value + " }");
            message.channel.send( JSON.parse(body).value );
        } else {
            console.log("error while fetching url");
        }
    });
}



function sendGeekJokePost(message, config){
    curl.get(config.geekjokes_url, null, (err, resp, body) => {
        if (resp.statusCode == 200) {
            console.log("Sending: { " + body + " }");
            message.channel.send( body );
        } else {
            console.log("error while fetching url");
        }
    });
}



function sendCatFact(message, config){
    curl.get(config.catfacts_url, null, (err, resp, body) => {
        if (resp.statusCode == 200) {
            let randomIndex = Math.floor(Math.random() * JSON.parse(body).all.length);
            console.log("Sending: { " + JSON.parse(body).all[randomIndex].text + " }");
            message.channel.send( JSON.parse(body).all[randomIndex].text );
        } else {
            console.log("error while fetching url");
        }
    });
}



function sendGoogleSearch(message, config, attr){
    let g_url = config.google_search_url;
    g_url += attr[0];
    let argscounter = 0;
    while (argscounter < attr.length) {
        if (argscounter != 0) {
            g_url += "+" + attr[argscounter];
        }
        argscounter++;
    }

    console.log("Sending: { " + g_url + " }");
    message.channel.send( g_url );
}



function sendUserAvatar(message, config){
    var testCounter = 0;
    var userID = message.author.id;
    var avatar = message.author.avatar;
    message.mentions.users.forEach(function(element){
        if(testCounter == 0){
            userID = element.id;
            avatar = element.avatar;
        }
        testCounter++;
    })

    var avatarURL = config.discord_avatar_url + userID + "/" + avatar + ".png?size=2048";

    console.log("Sending: { " + avatarURL + " }");
    message.reply(avatarURL);
}



function sendRpChoice(message){
    let options = ["✅","❌"];
    let result = options[Math.floor(Math.random() * options.length)];
    console.log("Sending: { " + result + " }");
    message.reply(result);
}



function sendSoloTweet(message, args, twitterClient){
    var params = {screen_name: args[0], count: 1, exclude_replies: true, include_rts: false};
    let thisItemLastPost = "";

    console.log("Getting single tweet from: " + args[0]);
    twitterClient.get('statuses/user_timeline', params, function (error, tweets, response) {
        if (!error) {
            let latestPost = "";
  
            if( tweets[0].entities.media != undefined ){
                if( tweets[0].entities.media[0].expanded_url.includes("video/1") ){

                    latestPost += "\n" + args[0] + ": " + tweets[0].entities.media[0].expanded_url;
                }else{
                    if ( tweets[0].entities.media[0].media_url_https ) {
                        latestPost += "\n" + args[0] + ": " + tweets[0].entities.media[0].media_url_https;
                    }else{
                        if (tweets.length > 0 && tweets[0].text) {
                            latestPost += "\n" + args[0] + ": \n" + tweets[0].text;
                        }
                    }
                }
            }else{
                console.log("Media is undefined");
                if((tweets.length > 0 && tweets[0].text) || (tweets.length > 0 && tweets[0].entities.urls)){
                    latestPost += "\n" + args[0] + ": \n" + tweets[0].text;
                    if(tweets[0].entities.urls.expanded_url){
                        latestPost += " \n" + tweets[0].entities.urls.expanded_url;
                    }
                }else{
                    console.log("Keine Tweets oder kein Text vorhanden");
                }
            }
  
            if (latestPost != thisItemLastPost) {
                message.channel.send( latestPost );
                console.log("New Post was sent by: " + args[0]);
                thisItemLastPost = latestPost;
            }
        }
    });
}



function watchTwitterList(message, config){
    config.twitterList.forEach(function(el){
        watch_twitter(message, el);
    })      
    message.channel.send(`Started Memes Watcher!`);
}



function stopMemesWatcher(message, intervalList){
    intervalList.map(clearInterval);
    console.log("Stopped Meme Watcher!");
    message.channel.send(`Stopped Memes Watcher`);
}