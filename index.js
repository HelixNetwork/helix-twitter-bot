const log = require('ulog');
const social = require('./modules/social.js');
const conf = require('./conf.json')
const db_pool = require('./modules/db_pool')
const performResponseAction = require('./modules/response_handler')

let stream = social.client.stream('statuses/filter', { track: conf.twitter.keyword });

// Once MongoDB connection establishes, We will start listening to tweets
db_pool().then(async () =>{

  let webhook = await social.autohook();
  log.info("Listening to tweets with keyword "+conf.twitter.keyword)

  // listening into DM events
  webhook.on('event', async (event) => {
    // only listen to user initiated dm message
    if (event.direct_message_events && event.apps == undefined) {      
      let command_string = event.direct_message_events[0].message_create.message_data;
      let userid = event.direct_message_events[0].message_create.sender_id;
      let dest = event.users[userid].screen_name;
      performResponseAction(command_string , true, dest ,userid)
    }
  });
  
  stream.on('tweet', (tweet) => {
  
  let command_string = tweet;
  let dest = tweet.user.screen_name;
  let replyid = tweet.id_str;
  let userid = tweet.user.id_str;
    log.debug(tweet.text);
    if ((tweet.text).substring(0,2) == "RT"){
      log.error("Retweet Ignored");
      return;
    }
    performResponseAction(command_string , false, dest ,userid, replyid )

});

stream.on('error', (err) => {
  log.error(err);
});
})
