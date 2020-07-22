const log = require('ulog');
const {compact} = require('lodash');
const commands = require('./modules/commands');
const social = require('./modules/social.js');
const conf = require('./conf.json')
const db_pool = require('./modules/db_pool')
const split = require('lodash').split
const findLastIndex = require('lodash').findLastIndex;
const drop = require('lodash').drop;

let stream = social.client.stream('statuses/filter', { track: conf.twitter.keyword });

/**
 * Perform responses according to the command requested
 * @param  command_string Command requested by the user
 * @param  isDm Checks whether the command is from a DM or tweet
 * @param  dest the user that sent a request and bot should reply to, e.g. @nyan_1337
 * @param {*} userid userid for dm
 * @param {*} replyid id to reply to tweet
 */

async function performResponseAction(command_string ,  isDm = false, dest , userid ,replyid = null){
  let match = split(command_string.text,' ');
  if (match == null){ return }
  // finds keyword index, replies may have some keywords coming in front
  let findCommandIndex = findLastIndex(match, function(o) { return o == conf.twitter.keyword || o == `@${conf.twitter.keyword}` ; }); 
  if(findCommandIndex == -1){
    commands.error(dest,isDm, userid , replyid , `Invalid Bot keyword 🙊, use ${conf.twitter.keyword}`)
    return
  }
  match = drop(match,findCommandIndex);
  match = compact(match) // removing unwanted spaces, null values etc

  let command = match[1]
  let target , value , unit;
  
  log.debug("parsed command: " + command);

    switch (command){
      case '!help':
        commands.help(dest, isDm, userid ,replyid);
        break;
      case '!terms':
        commands.terms(dest,isDm, userid , replyid);
        break;
      case '!register':
        commands.register(dest,isDm, userid, replyid);
        break;
      case '!deregister':
        commands.deregister(dest,isDm, userid , replyid);
        break;
      case '!account':
        commands.account(dest,isDm, userid , replyid);
        break;
      case '!withdraw':
        if(!isDm)
        {
          commands.restrictedCommand(dest, replyid)
          return
        }
        if(match.length <3){
          commands.error(dest,isDm, userid , replyid);
          return
        }
        target = match[2].toString();
        value = match[3];
        unit = match[4];
        log.info(`Withdraw target: ${target} and value: ${value}${unit}`);
        commands.withdraw(dest, userid, target, value,unit);
        break;
      case '!tip':
        if(match.length <3){
          commands.error(dest,isDm, userid , replyid);
          return
        }
        target = match[2].toString();
        value = match[3];
        unit = match[4];
        log.info(`Tip target: ${target} and value: ${value} ${unit}`);
        commands.tip(dest,isDm, userid , replyid, target, value,unit);
        break;
      default:
        commands.error(dest,isDm, userid , replyid);
        break;
    }

}

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
