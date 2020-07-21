const log = require('ulog');
const fs = require('fs');
const conf = require('../conf.json');

const MongoClient = require('mongodb').MongoClient;

const host = conf.db.host;
const db_name = 'helix-twitter';
let client;

async function init_db(){
  let client = await MongoClient.connect(host);
  return client.db(db_name);
}
let db = init_db();

/**
* This def. of put stores a mapping of twitter username, helix seed and an address index in the db
*
* @param twitter_id the twitter username, e.g. @_nyan1337
* @param helix_id the helix account seed
*/
function put(twitter_id, helix_id){
    log.info("Successfully connected to DB-Host");
    //const db = client.db(db_name);
    let accounts = db.collection('accounts');
    accounts.insert({ t_id: twitter_id, h_id: helix_id, idx: 0 });
    log.info(`Inserted: { ${twitter_id}, ${helix_id}, 0 }`);
    close();
}

/**
* This function updates the index of a specifiable twitter_id
*
* @param twitter_id the twitter username, e.g. @_nyan1337
*/
function update(twitter_id){
  MongoClient.connect(host, function(err, client) {
    if (err) throw err;
    log.info("Successfully connected to DB-Host");
    const db = client.db(db_name);
    let t_id = { t_id: twitter_id };
    db.collection('accounts').findOne(t_id, function(err, res) {
      if (err) throw err;
      let nidx = res.idx+1;
      let nentry = { $set: {idx: nidx} };
      db.collection('accounts').updateOne(t_id, nentry, function(err, res) {
        if (err) throw err;
        log.info(`Updated: { twitter: ${twitter_id}, idx: ${nidx} }`);
        client.close();
      });
    });
  });
}

/**
* This function returns the account object that contains the specifed twitter_id.
*
* @param twitter_id the twitter username, e.g. @_nyan1337
*/
async function read(twitter_id){
  const db = client.db(db_name);
  let id = { t_id: twitter_id };
  const res = await db.collection('accounts').findOne(id);
  log.info(res);
  return res;
}

/**
* This function removes the account object that contains the specifed twitter_id.
*
* @param twitter_id the twitter username, e.g. @_nyan1337
*/
function remove(id){
  MongoClient.connect(host, function(err, client) {
    if (err) throw err;
    log.info("Successfully connected to DB-Host");
    const db = client.db(db_name);
    let accounts = db.collection('accounts');
    let t_id = { t_id: id };
    accounts.deleteOne(t_id, function(err, res) {
      log.info(`Removed account: ${id}`);
      client.close();
    });
  });
}

function close(){
  client.close();
}

module.exports = {
  put,
  read,
  update,
  remove,
  close
}
