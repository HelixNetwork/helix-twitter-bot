const log = require('ulog');
const social = require('./modules/social.js');
const conf = require('./conf.json')
const db_pool = require('./modules/db_pool')
const performResponseAction = require('./modules/response_handler')

// Once MongoDB connection establishes, We will start listening to tweets
db_pool().then(async () =>{

  let webhook = await social.autohook();
  log.info("Listening to tweets with keyword "+conf.twitter.keyword)

  // listening into DM events
  webhook.on('event', async (event) => {
    // only listen to user initiated dm message

    if (event.direct_message_events && event.apps == undefined) {      
      let command_string = event.direct_message_events[0].message_create.message_data.text;
      let userid = event.direct_message_events[0].message_create.sender_id;
      let dest = event.users[userid].screen_name;
      performResponseAction(command_string , true, dest ,userid)
    }
    else if (event.tweet_create_events && event.apps == undefined && 
            event.tweet_create_events[0].user.name != conf.twitter.keyword){
      let command_string = event.tweet_create_events[0].text;
      let dest = event.tweet_create_events[0].user.screen_name;
      let replyid = event.tweet_create_events[0].id_str;
      let userid = event.tweet_create_events[0].user.id_str;
        if ((command_string).substring(0,2) == "RT"){
          log.error("Retweet Ignored");
          return;
        }
        
        performResponseAction(command_string , false, dest ,userid, replyid )    
    }
  });
})
