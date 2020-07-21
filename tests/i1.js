const log = require('ulog');
const commands = require('./modules/commands.js');
const social = require('./modules/social.js');
const conf = require('./conf.json')
const Twitter = require('twitter');

const client = new Twitter({
        consumer_key: conf.twitter.consumer_key,
        consumer_secret: conf.twitter.consumer_secret,
        access_token_key: conf.twitter.access_token_key,
        access_token_secret: conf.twitter.access_token_secret
});

const regex= new RegExp("(" + conf.twitter.keyword + ")(\\s)([a-zA-Z]+)", "i");

const stream = client.stream('direct_messages/events/show', {track: conf.twitter.keyword}, function (stream){
  stream.on('error', function(err){
    if (err) throw err;
    log.error(err);
   });
  stream.on('end', function(reason){
    log.error(reason);
  });
  stream.on('data', function (tweet){
      log.info(`TWEET | ${tweet.text}`);
      if ((tweet.text).substring(0,2) == "RT"){
        log.error("Retweet Ingrored");
        return;
      }
      let match = tweet.text.match(regex);
      if (match == null)
          return;
      let command = match[3];
      let name = tweet.user.screen_name;
      let msg = tweet.txt;
      let message = tweet.text;
      let replyid = tweet.id_str;

      switch (command){
        case '!tip':
          let value = 0;
          let target_address = "0000000000000000000000000000000000000000000000000000000000000000";
          let twitter_id = dest;
          let target_twitter_id = twitter_id;
          commands.tip(dest, replyid, twitter_id, target_twitter_id, value);
        case '!help':
          commands.help(dest, replyid);
      }
  });
});
