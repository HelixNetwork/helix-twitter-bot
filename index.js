const log = require('ulog');
const conf = require('./conf.json')
const url = require('url');
const ngrok = require('ngrok');
const http = require('http');
const { Autohook ,validateWebhook, validateSignature} = require('twitter-autohook');
const db_pool = require('./modules/db_pool')
const performResponseAction = require('./modules/response_handler')
const PORT = process.env.PORT
const token = process.env.AUTH_TOKEN_NGROK;

/**
 * Starts Webhook listener
 * @param port port number to listne to 
 * @param auth twitter config
 */
const startServer = (port, auth) => http.createServer((req, res) => {
  const route = url.parse(req.url, true);

  if (!route.pathname) {
    return;
  }

  if (route.query.crc_token) {
    try {
      if (!validateSignature(req.headers, auth, url.parse(req.url).query)) {
        log.error('Cannot validate webhook signature');
        return;
      }
    } catch (e) {
      log.error(e);
    }

    const crc = validateWebhook(route.query.crc_token, auth, res);
    res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(crc));
  }

  if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
    let body = '';
    req.on('data', chunk => {
    body += chunk.toString();
  
    // only listen to user initiated dm message
   let event = JSON.parse(chunk)
   if (event.direct_message_events && event.apps == undefined) {      
    let command_string = event.direct_message_events[0].message_create.message_data.text;
    let userid = event.direct_message_events[0].message_create.sender_id;
    let dest = event.users[userid].screen_name;
    performResponseAction(command_string , true, dest ,userid)
  }
  else if (event.tweet_create_events && event.apps == undefined && 
          event.tweet_create_events[0].user.screen_name != conf.twitter.keyword){
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
    req.on('end', () => {
      try {
        if (!validateSignature(req.headers, auth, body)) {
          log.error('Cannot validate webhook signature');
          return;
        }
      } catch (e) {
        log.error(e);
      }    
      res.writeHead(200);
      res.end();
    });
  }
}).listen(port);

// Once MongoDB connection establishes, We will start listening to tweets
db_pool().then(async () =>{
/**
 *  Webhook for DM functionality
 */
    // Ngrok configuration
    await ngrok.authtoken(token)
    const url = await ngrok.connect({
              addr: PORT, 
              authtoken: token,
              region: 'eu', 
          });
    const webhookURL = `${url}/helix-bot/webhook`;
    const config = {
      token:  process.env.TWITTER_ACCESS_TOKEN,
      token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      env: process.env.TWITTER_WEBHOOK_ENV,
    }
    startServer(PORT, config);
    const webhook = new Autohook(config);
    await webhook.removeWebhooks();
    await webhook.start(webhookURL);
    await webhook.subscribe(
      { 
          oauth_token:  process.env.TWITTER_ACCESS_TOKEN,
          oauth_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      });
  log.info("Listening to tweets with keyword "+conf.twitter.keyword)
  }).catch ((e) => {
    log.error(e);
    process.exit(1);
  })
