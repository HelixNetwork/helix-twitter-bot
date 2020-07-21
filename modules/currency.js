/**
Cryptocurrency related logic
*/

const log = require('ulog');
const fs = require('fs');
const {toLower , parseInt} = require('lodash');
const crypto = require('crypto');
const conf = require('../conf.json');

const Helix = require("@helixnetwork/core");
const Converter = require("@helixnetwork/converter");
const Validator = require('@helixnetwork/validators');
const generateAddress = require("@helixnetwork/core").generateAddress;

const PROVIDER = conf.helix.provider;
const STORE_TX = false;
const MWM = 2;
const DEPTH = 5;
const OUTPUT_PATH = "./txs";
const SECURITY = 2;
const CONVERSION_TABLE = {
  "$hlx":  1,
  "$khlx": 1000,
  "$mhlx": 1000000,
  "$ghlx": 1000000000,
  "$thlx": 1000000000000
} 

const helix = Helix.composeAPI({
  provider: PROVIDER
});

let storedTxBytes;

/**
 * Converts unit to equalent HLX
 * @param value value passed by the user
 * @param unit unit specified by the user
 */
function convertToHLX(value ,unit ='$mhlx'){
if(!CONVERSION_TABLE[toLower(unit)]){
  return false
}
return value * CONVERSION_TABLE[toLower(unit)];
}

/**
 * Computes number rounded down to precision
 *
 * @method roundDown
 * @param {number} number
 * @param {number} decimals
 *
 * @returns {number}
 */
 function roundDown(number, decimals) {
  decimals = decimals || 0;
  return Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Formats Helix value
 *
 * @method formatValue
 * @param {number} value
 *
 * @returns {number}
 */
 function formatValue (value) {
  let negative = false;
  if (value < 0) {
      negative = true;
      value = -value;
  }
  switch (true) {
      case value < 1000:
          break;
      case value < 1000000:
          value /= 1000;
          break;
      case value < 1000000000:
          value /= 1000000;
          break;
      case value < 1000000000000:
          value /= 1000000000;
          break;
      default:
          value /= 1000000000000;
          break;
  }

  if (negative === true) {
      return -value;
  }

  return value;
}

/**
 * Gets relevant denomination for provided Helix value
 *
 * @method formatUnit
 * @param {number} value
 *
 * @returns {string}
 */
function formatUnit(value){
  if (value < 0) {
      value = -value;
  }

  switch (true) {
      case value < 1000:
          return '$HLX';
      case value < 1000000:
          return '$kHLX';
      case value < 1000000000:
          return '$mhlx';
      case value < 1000000000000:
          return '$gHLX';
      default:
          return '$tHLX';
  }
}


/**
 * Format hlx to human readable format
 * @param {number} hlx - Input value in hlx
 * @param {boolean} showShort - Should output short format
 * @param {boolean} showUnit - Should output unit
 *
 * @returns {string}
 */
 function formatHlx(hlx, showShort, showUnit) {
  const formattedValue = formatValue(hlx);
  const outputValue = !showShort
      ? formattedValue
      : roundDown(formattedValue, 1) + (hlx < 1000 || (hlx / formattedValue) % 10 === 0 ? '' : '+');

  return `${outputValue}${showUnit ? ' ' + formatUnit(hlx) : ''}`;
}

/**
 * Create random hexadecimal seed
 * @param {number} max - max range
 * @returns {string} hexadecimal string
 */
// eslint-disable-next-line no-unused-vars
function generateSeed(max = 256, len = 32){
    const buf = crypto.randomBytes(len);
    return buf.toString('hex');
}

/**
* Creates a helix public key for a specifiable index using the seed
*
* @param seed the helix id
* @param idx index of the last generated address + 1
*/
function generateAddr(seed, idx){
    return generateAddress(seed, idx, SECURITY, true);
}

/**
* Function to get all balances of a seed
* @param seed helix id
* @param depth how many addresses to generate (usually we generate idx*addresses to get the full balance)
*/
async function getBalances(seed, depth=100){
  let addresses = [];
  for(let i=0;i<=depth;i++){
    let addr = generateAddr(seed, i);
    addresses.push(addr);
  }
  try{
  let res = await helix.getBalances(addresses, 100);
  return res.balances.reduce((a, b) => a + b, 0);
  }catch(err){
    log.error("Some Error occured with balance check. Error is",err)
  }
}

/**
 * Returns Human readable balance
 * @param seed seed of the account to get balance
 * @param depth to the depth at which balance have to be looked up
 */

async function getBalancesWithUnit(seed , depth){
  let balance = await getBalances(seed ,depth);
  return formatHlx(balance,false,true);
}

/**
* Function to transfer HLX
* @param seed helix id
* @param target_value amount to transfer in HLX
* @param address target address
* @param address_index address index
* @param unit unit of transferred money
* @param message optional message
* @param tag optional tag
*/
async function transfer(seed, target_value, address,address_index ,unit="$mHLX", message="helloworld", tag="1337"){
  
  const txStatus = Object.freeze(conf.error_codes);
  let results ={}
  let value = parseInt(target_value)
   // Checks whether the arguments passed in are valid or not
   if(!Validator.isAddress(address) || !value){
    results.status = txStatus.invalidparams
    return results
 }
   value = convertToHLX(parseInt(target_value),unit);
  
  if(value === false){
    results.status = txStatus.invalidUnit
    return results
  }
  
  let transfer =[{
    address: address,
    value,
    message: Converter.asciiToTxHex(message),
    tag: tag
  }];
  try{
  let currentBalance = await getBalances(seed);

 // Check whether the account have enough balance or not
   if(currentBalance < value){
    log.info("Insufficient balance in account for sending to ",address);
    results.status = txStatus.insufficientBalance
    return results
  }

  // prepare inputs for the transactions
  let {inputs} = await helix.getInputs(seed,{start:0, end:address_index , security:2 , threshold:value}); 
  let TxBytes = await helix.prepareTransfers(seed, transfer, { security: SECURITY , inputs});
  storedTxBytes = TxBytes;
   results.transfer = await helix.sendTransactionStrings(storedTxBytes, DEPTH, MWM);
   results.status = txStatus.completed;
  log.info("Transfer to account: " + address + " has been submitted.");
  if (STORE_TX){
   let path = OUTPUT_PATH+'tx_' + Math.floor((new Date()).getTime() / 1000) + '.json';
   fs.writeFileSync(path, JSON.stringify(results, null , 2));
   log.info("Transfer written to " + path);
  }
  return results
}catch(err){
  // Have to handle the negative cases
  log.error("error occured while sending to address = ", address, " error =" ,err);
   results.status = txStatus.error
   return results

}
}

module.exports = {
  generateSeed,
  generateAddr,
  transfer,
  getBalances,
  getBalancesWithUnit
}
