const log = require('ulog');
const account_model = require('./models/account');

/**
 * Makes twiiter handle names to start with @
 * @param  twitter_id twitter username
 */

function modifyTwitterHandle(twitter_id){
  return twitter_id[0] != '@'?'@'+twitter_id:twitter_id;
}


/**
* This def. of put stores a mapping of twitter username, helix seed and an address index in the db
*
* @param twitter_id the twitter username, e.g. @_nyan1337
* @param helix_id the helix account seed
*/
 function put(twitter_id, helix_seed){
    twitter_id = modifyTwitterHandle(twitter_id)
    let account = new account_model({twitter_id,helix_seed,address_index: 0})
   return  account.save().then(()=>{ 
    log.info(`Inserted: { ${twitter_id}, ${helix_seed}, 0 }`);
    }).catch((err)=>{
      log.error("Could not insert account. Error =>",err)
      throw err
    })
}
/**
* This function updates the index of a specifiable twitter_id
*
* @param twitter_id the twitter username, e.g. @nyan_1337
*/
 function update(twitter_id){
  twitter_id = modifyTwitterHandle(twitter_id)
    return account_model.findOne({twitter_id}).then((res) =>{   
      let address_index = res.address_index +1;
      account_model.findOneAndUpdate({twitter_id}, {address_index}).then(() => {
        log.info(`Updated: { twitter_id: ${twitter_id}, idx: ${address_index} }`);
      })
    }).catch((err) =>{
       throw err;
    });
}

/**
* This function returns the account object that contains the specifed twitter_id.
*
* @param twitter_id the twitter username, e.g. @_nyan1337
*/
async function read(twitter_id){
  twitter_id = modifyTwitterHandle(twitter_id)
    const res = await account_model.findOne({twitter_id});
    return res;
}

/**
* This function removes the account object that contains the specifed twitter_id.
*
* @param twitter_id the twitter username, e.g. @_nyan1337
*/
function remove(twitter_id){
    twitter_id = modifyTwitterHandle(twitter_id)
    return account_model.deleteOne({twitter_id}).then(() => {
      log.info(`Removed account: ${twitter_id}`);
    }).catch((err) =>{
      throw err
    });
}

module.exports = {
  put,
  read,
  update,
  remove
}
