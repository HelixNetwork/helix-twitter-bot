/**
Command defs
*/

const log = require('ulog');
const currency = require('./currency.js');
const db = require('./db.js');
const social = require('./social.js');
const conf = require('../conf.json');
const txStatus = Object.freeze(conf.error_codes);

/**
* Displays command overview to user
*
* @param dest the user that sent a request and bot should reply to, e.g. @nyan_1337
* @param isDm whether the command from DM or a tweet
* @param userid userid for dm
* @param replyid id to reply to
*/
function help(dest,isDm, userid , replyid){
  log.info(`@${dest} requested !help`);
  if (isDm){
    social.dm(dest,userid,conf.messages.help,replyid)
  }else{
    social.tweet(dest, replyid, conf.messages.help_ext);
  }
  return conf.messages.help;
}

/**
* Displays terms to user
*
* @param dest the user that sent a request and bot should reply to, e.g. @nyan_1337
* @param isDm whether the command from DM or a tweet
* @param userid userid for dm
* @param replyid id to reply to
*/
function terms(dest,isDm, userid , replyid){
  log.info(`@${dest} requested !terms`);
  if(isDm){
    social.dm(dest,userid,conf.messages.terms,replyid)
  }
  else{ 
    social.tweet(dest, replyid, conf.messages.terms);
  }
  return conf.messages.terms;
}

/**
* On invalid command
*
* @param dest the user that sent a request and bot should reply to, e.g. @nyan_1337
* @param isDm whether the command from DM or a tweet
* @param userid userid for dm
* @param replyid id to reply to
* @param error_message error message that have to be shown
*/
function error(dest,isDm, userid , replyid, error_message=""){
  log.info(`@${dest} requested an invalid command`);
  if(error_message == "")
    error_message = conf.messages.invalid_command
  if(isDm){
    social.dm(dest,userid,error_message,replyid)
  }
  else{
    social.tweet(dest, replyid, error_message);
  }
  return error_message;
}


/**
* On restricted command like account and withdraw
*
* @param dest the user that sent a request and bot should reply to, e.g. @nyan_1337
* @param replyid id to reply to
*/
function restrictedCommand(dest, replyid){
  log.info(`@${dest} requested a restricted command publicly`);
  social.tweet(dest, replyid, conf.messages.restricted_command);
  return conf.messages.restricted_command;
}

/**
* Allows user to register
* - Creates a helix id and maps it to twitter id in db
* @param dest the user that sent a request and bot should reply to, e.g. @nyan_1337
* @param isDm whether the command from DM or a tweet
* @param userid userid for dm
* @param replyid id to reply to
*/
async function register(dest,isDm, userid, replyid){
  log.info(`@${dest} requested !register`);
  let d = await db.read(dest);
  if (d != null){
    log.error("ID already in use!");
    if(!isDm)
    social.tweet(dest,replyid, "Seems like you already have an account 🤔. A direct message has been sent to you 😊");
    social.dm(dest, userid, "You already have an account.🤔"+"\n Try HelixTipBot !help for more✨",replyid);
    return;
  }
  let helix_id = currency.generateSeed();
  log.info(`helix_id: ${helix_id}`);
  await db.put(dest, helix_id);
  let addr = currency.generateAddr(helix_id, 0);
  log.info(`addr: ${addr}`);
  await db.update(dest);
  if(!isDm)
  social.tweet(dest,replyid, "Request received 😍. A direct message has been sent!✌");
  social.dm(dest, userid, "Yaay!!!🎉🎉🎉.New Account successfully registered.✨ \n Generated deposit address:\n" + addr,replyid);
  return addr;
}

/**
* Allows user to deregister
* - removes account object containing the twitter id
* @param dest the user that sent a request and bot should reply to, e.g. @nyan_1337
* @param isDm whether the command from DM or a tweet
* @param userid userid for dm
* @param replyid id to reply to
*/
function deregister(dest, isDm,userid, replyid){
  log.info(`@${dest} requested !deregister`);
  db.remove(dest);
  if(!isDm)
  social.tweet(dest,replyid, "Request received😥. A direct message has been sent!⚡");
  social.dm(dest, userid, `The account @${dest} has been removed from our database ⛑, you may re-register at any time.🙋`,replyid);
}

/**
* Allows user to receive account information
* @param dest the user that sent a request and bot should reply to, e.g. @nyan_1337
* @param isDm whether the command from DM or a tweet
* @param userid userid for dm
* @param replyid id to reply to
*/
//todo display helix id, when dms are working (- helix_id: ${d.helix_seed}\n)
async function account(dest,isDm, userid, replyid){
  log.info(`@${dest} requested !account`);
  let d = await db.read(dest);
  if(!isDm)
  social.tweet(dest, replyid, "Request received 🌟. A direct message will be sent shortly!✌");
  if (d == null){
    log.error("ID Not found");
    social.dm(dest, userid, `No account found😲. Kindly register a new account using HelixTipBot !register 😊`,replyid);
    return;
  }
  social.dm(dest, userid, `🌀 twitter_id: @${dest}\n\n📢 deposit address: ${currency.generateAddr(d.helix_seed,d.address_index)}\n\n🎊 balance: ${await currency.getBalancesWithUnit(d.helix_seed, d.address_index)}\n\n⭐ helix_seed: \n${d.helix_seed}`,replyid);
}

/**
* Allows user to deregister
* - removes account object containing the twitter id
* @param dest the user that sent a request and bot should reply to, e.g. @nyan_1337
* @param userid userid for dm
* @param target_address address of the receiver
* @param value value that should be withdrawn
* @param unit unit of transferred money
*/
async function withdraw(dest,userid, target_address, value , unit = "$mHLX"){
  log.info(`${dest} requested !withdraw`);
  let d = await db.read(dest);
  if (d == null){
    social.dm(dest, userid, `You do not have an account setup yet 🙈. Please use !register to create an account!🌈`);
    return;
  }
  let result = await currency.transfer(d.helix_seed, value, target_address,d.address_index,unit);
  if(result.status === txStatus.insufficientBalance){
    social.dm(dest, userid, `You don't have enough balance to do this transaction.😞.`);
  } else if (result.status === txStatus.error){
    social.dm(dest, userid, `Something went wrong!!! 🙄`);
  } else if (result.status === txStatus.invalidparams){
    social.dm(dest, userid, `You have entered invalid withdrawal parameters 🙄`);
  } else if (result.status === txStatus.invalidUnit){
    social.dm(dest, userid, `You have entered invalid unit 🙄`);
  }
  else{
    social.dm(dest, userid, `You have withdrawn ${value} ${unit} to the address: ${target_address} 🎉🎉. You can check the transaction status here: https://explorer.helixmain.net/tx/${result.transfer[0].hash} `);
  }
  
}

/**
* Allows user to tip other users
* @param dest the user that sent a request and bot should reply to, e.g. @nyan_1337
* @param isDm whether the command from DM or a tweet
* @param userid userid for dm
* @param replyid id to reply to
* @param target_dest target user for tip
* @param value value that should be tipped
* @param unit unit of transferred money
*/
async function tip(dest, isDm,userid, replyid, target_dest, value,unit ='$mHLX'){
  log.info(`@${dest} requested !tip`);
  let target;
  let d = await db.read(dest);
  let d2 = await db.read(target_dest);
  if (d == null){
    if(!isDm)
    social.tweet(dest, replyid, `You seem to have no account 😲.Register a new account by tweeting HelixTipBot !register.✨`);
    social.dm(dest, userid, `You seem to have no account 😲.Register a new account by messaging me HelixTipBot !register.✨`,replyid);
    return
  }
  else if (d2 == null){
    let helix_id = currency.generateSeed();
    await db.put(target_dest, helix_id);
    target = currency.generateAddr(helix_id, 0);
    await db.update(target_dest);
  } else {
     target = currency.generateAddr(d2.helix_seed, d2.address_index);
  }
  log.debug("target: " + target);
  log.debug("value: " + value);
  let results = await currency.transfer(d.helix_seed, value, target,d.address_index ,unit);
  if(results.status === txStatus.insufficientBalance){
    social.dm(dest, userid, `You don't have enough balance to do this transaction.😞.`,replyid);
    return
  } else if (results.status === txStatus.error){
    social.dm(dest, userid, `Something went wrong!!! 🙄`,replyid);
    return
  } else if (results.status === txStatus.invalidparams){
    social.dm(dest, userid, `You have entered invalid tips parameters 🙄`,replyid);
    return
  } else if (results.status === txStatus.invalidUnit){
    social.dm(dest, userid, `You have entered invalid unit 🙄`,replyid);
    return
  }
  // No need to update index for zero value transactions
  if(value !=0 ){
  await db.update(dest);
  await db.update(target_dest);
  }   
  social.client.get('/users/show', { screen_name: target_dest }, (err, res) => {
    if(!isDm)
    social.tweet(dest, replyid, `${value} ${unit}  tip sent to ${target_dest} 🎉🎉. A DM has been sent with further information. Thank you for using our bot`);
    social.dm(dest, userid, `${value} ${unit} tip sent to ${target_dest}  🎉🎉. You can check the transaction status here: https://explorer.helixmain.net/tx/${results.transfer[0].hash} 😍`,replyid);
    if (err) { log.error("There was an error getting the target user id.") }
    social.dm(target_dest, res.id_str, `Greetings from HelixTipBot.🙋\n\nYou have been tipped ${value} ${unit} by @${dest} 🎉🎉.\n\n You can check the transaction status here: https://explorer.helixmain.net/tx/${results.transfer[0].hash} 😍.\n\n In order to claim your tip, you first need to download the Nautilus wallet from https://hlx.ai/wallet and set up an HLX address. ☝ \n\n If you already have an address, you can claim your tip by replying: @HelixTipBot !withdraw <address> <amount> <unit> and for the full overview of commands @HelixTipBot !help🙋`,replyid);
  });
}

module.exports = {
  help,
  terms,
  error,
  restrictedCommand,
  register,
  deregister,
  account,
  withdraw,
  tip
}
