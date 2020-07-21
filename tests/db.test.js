const mongoose = require('mongoose');
const  MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const opts = require("../conf.json").db.options
const {expect} = require("chai");

const db = require("../modules/db");
const testData = require("./test-data/testData.json")

let mongoServer;


before(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri, opts);
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('A new user should be added to the database', () => {
  it('When all the parameters are in correct format, it should succesfully store a new user', async () => {
    await db.put(testData.accounts[0].twitter_id,testData.accounts[0].helix_seed)
    let response = await db.read(testData.accounts[0].twitter_id)
    expect(response.helix_seed).equal(testData.accounts[0].helix_seed)
    expect(response.address_index).equal(0)
  });

  // it('When parameters are of wrong format ,it should not store a new user', async () => {
  //   expect( db.put(56,"a")).to.throw();
  // });


});