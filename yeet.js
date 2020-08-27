const auth = require('./auth.json');
const Discord = require('discord.js');
const curl = require('curl');
var Twitter = require('twitter');

const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );


var intervalList = [];
var usedRedditLinks = [];

var twitterClient = new Twitter({
    consumer_key: auth.twitter_consumer_key,
    consumer_secret: auth.twitter_consumer_secret,
    access_token_key: auth.twitter_access_token_key,
    access_token_secret: auth.twitter_access_token_secret
});


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


const client = new Discord.Client();

client.on('ready', () => {
    console.log('Bot wurde gestartet.');
});

client.on('message', message => {


  if (message.content.substring(0, 1) == '$') {
      var args = message.content.substring(1).split(' ');

      var cmd = args[0];
      args = args.splice(1);

      console.log("Befehl { " + message.content + " } wurde empfangen.");
  }

  switch (cmd) {

    case 'help':
	console.log("Sending command list");
        message.channel.send(
                "**$yeet**: Returns Yote! \n" +
                "**$sidi [BEGRIFF]**: Returns Sag ich da immer sentence. \n" +
                "**$wohnung**: Returns the bots current location Kappa. \n" +
                "**$r [subreddit name from url]**: Returns a new post from given subreddit. \n" +
                "**$exc**: Returns a question. \n" +
                "**$thx**: Returns a thank you message. \n" +
                "**$geekjoke**: Returns a joke. \n" +
                "**$animal [cats/dogs]**: Returns either an image of a cat o a dog. \n" +
                "**$numberfact**: Returns a number fact. \n" +
                "**$chucknorris**: Returns a Chuck Norris joke. \n" +
                "**$catfacts**: Returns a cat fact. \n" +
                "**$google [BEGRIFF/SATZ]**: Returns Google Search link for given word/sentence \n" +
                "**$avatar [@user]**: Replies with the avatar of the user executing the command \n" +
                "**$rp**: Returns a ✅ or ❌. \n" +
                "**$tweet [twitter tag of user]**: Returns a random tweet of given account. \n" +
                "**$wt [twitter tag of user]**: Gets a twitter users newest tweet every minute \n" +
                "**$wm**: start memes watcher \n" +
                "**$swm**: stops memes watcher"
        );
        break;


    case 'r':
        if(args[0] == ""){ message.reply("Bitte gib ein Subreddit an."); }
        let subreddit = args[0];

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
            
                    usedRedditLinks.push(randomResult);
            
                    console.log("Sending: { " + randomResult + " }");
                    message.reactions.removeAll();
                    message.channel.send(randomResult);
                }else{
                    console.log("Sending: { Konnte Subreddit nicht finden. }");
                    message.reactions.removeAll();
                    message.channel.send("Konnte Subreddit nicht finden.");
                }


            } else {
                console.log("error while fetching url: " + data);
                console.log("Sending: { Fehler: Entweder ist ein Netzwerk-Fehler aufgetreten oder es gibt das Subreddit nicht }");
                message.reactions.removeAll();
                message.reply("Fehler: Entweder ist ein Netzwerk-Fehler aufgetreten oder es gibt das Subreddit nicht");
            }
        });

        break;

    case 'getRedditList':
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
        break;

    case 'yeet':
        console.log("Sending: { Yote! }");
        message.channel.send('Yote!');
        break;

    case 'sidi':
      let secondPart = args[0].toLowerCase();
      let exceptionArray = ["a", "e", "i", "o", "u", "y", "A", "E", "I", "O", "U", "ä", "ö", "ü", "Ä", "Ö", "Ü", "Y"];
      let zaehl = 0;
      while (zaehl < secondPart.length) {
          if (exceptionArray.indexOf(secondPart[0]) == -1) {
              secondPart = secondPart.substring(1);
          }
          zaehl++;
      }

      let schm = args[0] + ' Schm' + secondPart + ' sag ich da immer.';
      console.log("Sending: { " + schm + " }");
      message.channel.send(schm);
      break;
  
      case 'animal':
        var api_url = "";

        if (args[0] == "cats") {
            api_url = 'https://api.thecatapi.com/v1/images/search?'
        }

        if (args[0] == "dogs") {
            api_url = 'https://api.thedogapi.com/v1/images/search?'
        }

        api_url += "size=full&";
        api_url += "mime_type=jpg,png,gif";
        api_url += "e5166907-bf66-46b9-bf6d-946504ce5323";

        curl.get(api_url, null, (err, resp, data) => {
            if (resp && resp.statusCode == 200) {
                console.log("Sending: { " + JSON.parse(data)[0].url + " }");
                message.channel.send( JSON.parse(data)[0].url );
            } else {
                console.log("error while fetching url");
            }
        });

        break;

    case 'numberfact':
        curl.get("http://numbersapi.com/random/", null, (err, resp, body) => {
            if (resp.statusCode == 200) {
                console.log("Sending: { " + body + " }");
                message.channel.send( body );
            } else {
                console.log("error while fetching url");
            }
        });
        break;

    case 'chucknorris':
        curl.get("https://api.chucknorris.io/jokes/random", null, (err, resp, body) => {
            if (resp.statusCode == 200) {
                console.log("Sending: { " + JSON.parse(body).value + " }");
                message.channel.send( JSON.parse(body).value );
            } else {
                console.log("error while fetching url");
            }
        });
        break;

  case 'geekjoke':
      curl.get("https://geek-jokes.sameerkumar.website/api", null, (err, resp, body) => {
          if (resp.statusCode == 200) {
              console.log("Sending: { " + body + " }");
              message.channel.send( body );
          } else {
              console.log("error while fetching url");
          }
      });
      break;
  
  
      case 'catfacts':
        curl.get("https://cat-fact.herokuapp.com/facts", null, (err, resp, body) => {
            if (resp.statusCode == 200) {
                let randomIndex = Math.floor(Math.random() * JSON.parse(body).all.length);
                console.log("Sending: { " + JSON.parse(body).all[randomIndex].text + " }");
                message.channel.send( JSON.parse(body).all[randomIndex].text );
            } else {
                console.log("error while fetching url");
            }
        });
        break;

      case 'wohnung':
          let wohnungen = ["einem Sumpf", "AmsterDARRRRM", "DARRRRMSTADT", "dem urANUS"];
          let randomIndex = Math.floor(Math.random() * (wohnungen.length));
          let msg = "Ich wohne in " + wohnungen[randomIndex];
          console.log("Sending: { " + msg + " }");
          message.channel.send( msg );
          break;

      case 'exc':
          console.log("Sending: { Entschuldigen Sie, kann ich in Ihre Handtasche ejakulieren? }");
          message.channel.send( "Entschuldigen Sie, kann ich in Ihre Handtasche ejakulieren?" );
          break;

      case 'thx':
          console.log("Sending: { Vielen DARRRRRM }");
          message.channel.send( "Vielen DARRRRRM" );
          break;

      case 'google':
          let g_url = "https://www.google.de/search?q=";
          g_url += args[0];
          let argscounter = 0;
          while (argscounter < args.length) {
              if (argscounter != 0) {
                  g_url += "+" + args[argscounter];
              }
              argscounter++;
          }

          console.log("Sending: { " + g_url + " }");
          message.channel.send( g_url );
          break;

      
      case 'avatar':
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

        var avatarURL = "https://cdn.discordapp.com/avatars/" + userID + "/" + avatar + ".png?size=2048";

        console.log("Sending: { " + avatarURL + " }");
        message.reply(avatarURL);

        break;    

        case "rp":
            let options = ["✅","❌"];
            let result = options[Math.floor(Math.random() * options.length)];
            console.log("Sending: { " + result + " }");
            message.reply(result);
            break;

      case 'wt':
        if (message.author.id == 293049891184443392) { // Nur ich darf den Befehl ausführen :feelsGreedMan:
            console.log("Watching solo twitter: " + args[0]);
            watch_twitter(message, args[0]);
        }
        break;

        case 'tweet':
                                
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

            break;

      case 'wm':
          if (message.author.id == 293049891184443392) {
              watch_twitter(message, 'cursed_bot');
              watch_twitter(message, 'DankRedditMeme');
              watch_twitter(message, 'WholesomeMeme');
              watch_twitter(message, 'theMemesBot');
              watch_twitter(message, 'ItMeIRL2');
              watch_twitter(message, 'Duck_page');
              watch_twitter(message, 'NoContextHumans');
              watch_twitter(message, 'myunclesmemes');
              watch_twitter(message, 'itanimeirl');
              watch_twitter(message, 'it_meirl');
              watch_twitter(message, 'AAAAAGGHHHH');
              watch_twitter(message, 'BestMemeBot');
              watch_twitter(message, 'DankMemesBot420');
              watch_twitter(message, 'StrangestMp4');
              
              message.channel.send(`Started Memes Watcher!`);
          }
          break;

      case 'swm':
          if (message.author.id == 293049891184443392) {
              intervalList.map(clearInterval);
              console.log("Stopped Meme Watcher!");
              message.channel.send(`Stopped Memes Watcher`);
          }
          break;


   }

});

client.login(auth.token);
