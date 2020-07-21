/**
 * Account Data Model for storing in Mongo
 */
let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let accountSchema = new Schema(
  {
    twitter_id: {type: String, required: true, maxlength: 20},
    helix_seed: {type: String, required: true, maxlength: 64},
    address_index: {type: Number,required: true, min:[0 , "Invalid address index"]},
  }
);

module.exports = mongoose.model('accounts', accountSchema);
