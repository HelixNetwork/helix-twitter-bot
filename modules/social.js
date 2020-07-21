/**
Twitter and Telegram integration
*/
const log = require('ulog');
const Twitter = require('twit');
const { Autohook } = require('twitter-autohook');
const conf = require('../conf.json');

let client = new Twitter({
        consumer_key: conf.twitter.consumer_key,
        consumer_secret: conf.twitter.consumer_secret,
        access_token: conf.twitter.access_token_key,
        access_token_secret: conf.twitter.access_token_secret
});

// Outputs the follower counts
client.get('followers/ids', function(err, tweets){
  if(err) {log.error(err);}
  log.info('Connected to Twitter. Followers: ' + tweets.ids.length);
});



/**
 *  Webhook for DM functionality
 */
async function autohook(){
  try {
    const webhook = new Autohook({
      token: conf.twitter.access_token_key,
      token_secret: conf.twitter.access_token_secret,
      consumer_key: conf.twitter.consumer_key,
      consumer_secret: conf.twitter.consumer_secret,
      env: conf.twitter.env,
      port: 80
    });

    await webhook.removeWebhooks();
    await webhook.start();
    await webhook.subscribe(
      { 
          oauth_token:conf.twitter.access_token_key, 
          oauth_token_secret:conf.twitter.access_token_secret
      });

      return webhook;

  } catch (e) {
    console.error(e);
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
}

/**
* Function to tweet using twitter client
*
* @param dest the user that sent a request and bot should reply to, e.g. @_nyan1337
* @param replyid tweet id to reply to
* @param msg message that should be wrapped into reply
*/
function tweet(dest, replyid, msg){
  log.info(`Preparing tweet for @${dest}...`);
  let t = '@' + dest + ' ' + msg; //currently not needed: + '\n request-id: ' + '[' + currency.generateSeed(256, 1, 8) + ']';
  let tobj = { status: t, in_reply_to_status_id: replyid };
  log.debug(t);
  client.post('statuses/update', tobj, function (err) {
      if (err){log.error(err)}
      else {log.info(`Tweet sent to ${dest}!`)}
  });
}
/**
* Function to dm using twitter client
*
* @param dest the user that sent a request and bot should reply to, e.g. @_nyan1337
* @param userid userid to dm
*/
function dm(dest, userid, msg){
  log.info(`Preparing DM for @${dest}...`);
  // send typcling response
  typing(dest,userid);
  let m = '@' + dest + ' ' + msg;
  let msgobj = {
        event: {
            type: "message_create",
            message_create: {
                target: {
                    recipient_id: userid
                },
                message_data: {
                    text: msg,
                    quick_reply: conf.quick_reply_obj
            }
        }
      }
  };

  log.debug(m);

  // delaying dm to show typing indicator
  setTimeout(() => client.post('direct_messages/events/new', msgobj, function(err){
    if (err){log.error(err)}
    else {log.info(`DM sent to @${dest}!`)}
  }),1500 )
  
}

/**
 * Function to send a typing response to user
 * @param  dest the user that sent a request and bot should reply to, e.g. @_nyan1337
 * @param  userid userid to dm
 */
function typing(dest, userid){
  log.info(`Preparing typing indicator for @${dest}...`);
  let msgobj = {
        "recipient_id":userid
      }

  client.post('direct_messages/indicate_typing', msgobj, function(err){
    if (err){log.error(err)}
    else {log.info(`Typing response sent to @${dest}!`)}
  });

}

module.exports = {
  tweet,
  dm,
  client,
  autohook,
  typing
}
