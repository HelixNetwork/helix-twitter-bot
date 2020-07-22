const mongoose = require("mongoose");
const MongoMemoryServer = require("mongodb-memory-server").MongoMemoryServer;
const opts = require("../conf.json").db.options;
const { expect } = require("chai");

const db = require("../modules/db");
const testData = require("./test-data/testData.json");

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

describe("A new user should be added to the database", () => {
  it("When all the parameters are in correct format, it should succesfully store a new user", async () => {
    await db.put(
      testData.accounts[0].twitter_id,
      testData.accounts[0].helix_seed
    );
    let response = await db.read(testData.accounts[0].twitter_id);
    expect(response.helix_seed).equal(testData.accounts[0].helix_seed);
    expect(response.address_index).equal(0);
  });

  it("When parameters are of wrong format,it should not store a new user", async () => {
    let bug =
      "ValidationError: accounts validation failed: helix_seed: Path `helix_seed` (`a84921007ca75c5239ea56c833440c4596f9e2d4b25051580e83cd950626d86f9iokjuhgrgusnd1234`) is longer than the maximum allowed length (64).";
    try {
      db.put(testData.accounts[4].twitter_id, testData.accounts[4].helix_seed);
    } catch (e) {
      expect(e.message).to.equal(bug);
    }
  });
});

describe("Updates the index of a specifiable User", () => {
  it("Should update the account object from the database that contains the specifed user", async () => {
    await db.update(testData.accounts[0].twitter_id);
    let response = await db.read(testData.accounts[0].twitter_id);
    expect(response.address_index).equal(1);
  });

  it("Should throw error Otherwise", async () => {
    let response = await db.update(testData.accounts[0].twitter_id);
    expect(response).equal(undefined);
  });
});

describe("A user should be removed from the database", () => {
  it("Should remove the account object from the database that contains the specifed user", async () => {
    await db.remove(testData.accounts[0].twitter_id);
    let response = await db.read(testData.accounts[0].twitter_id);
    expect(response).equal(null);
    // expect(response.address_index).equal(0)
  });

  it("Should throw error if the database does not have the specifed user", async () => {
    let response = await db.remove(testData.accounts[4].twitter_id);
    console.log("Response===", response);
    // let bug =
    //   "ValidationError: accounts validation failed: helix_seed: Path `helix_seed` (`a84921007ca75c5239ea56c833440c4596f9e2d4b25051580e83cd950626d86f9iokjuhgrgusnd1234`) is longer than the maximum allowed length (64).";
    // try {
    //   db.put(testData.accounts[4].twitter_id, testData.accounts[4].helix_seed);
    // } catch (e) {
    //   expect(e.message).to.equal(bug);
    // }
  });
});
