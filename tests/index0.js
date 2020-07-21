const log = require('ulog');
const commands = require('./modules/commands.js');

//TODO: needs to be adapted to twitter bot

exports.handler = function (event, context, callback) {
    log.info(event);
    let data = JSON.parse(event.body);
    let res ={
        "statusCode": 200,
        "headers": {
            "Content-Type": "*/*",
        }
    };
    log.info(data);
    log.info(data.message);
    handleBotMessage(data.message)
        .then(() => {
          res.body = "OK";
          callback(null, res)
        })
        .catch((err) => {
          // we still send 200
          // to prevent repeated webhook calls
          res.body = `Error: ${err}`;
          callback(null, res)
        });
};

async function handleBotMessage (message) {
      log.info("Handling message");
      log.info(message);

      let chatId = message.chat.id;
      let command = message.text.toString();

      let showError =  (err, err_text) => {
        log.info(err)
        bot.sendMessage({
          chat_id: chatId,
          parse_mode: "Markdown",
          text: err_text
        })
      }

      log.info(command);

      switch (command) {
        case '!help':
          commands.help();
        case '!register':
          commands.register();
        case '!balance':
          commands.balance();
        case '!account':
          commands.account();
        case '!withdraw'
          commands.withdraw();
        case '!send':
          commands.send();
      }
   }

   client.stream('statuses/filter', {track: settings.twitter.twitterkeyword}, function (stream) {
          stream.on('error', function(error) {
            winston.error('Something went wrong with the twitter streaming api. ');
           });
  stream.on('end', function(reason) {
                    winston.error('Twitter streaming api throws end');
  });
