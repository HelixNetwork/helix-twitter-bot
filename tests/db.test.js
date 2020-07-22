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

  // it('When parameters are of wrong format ,it should not store a new user', async () => {
  //   expect( db.put("","")).to.throw();
  // });
});

describe("Updates the index of a specifiable User", () => {
  it("Should update the account object from the database that contains the specifed user", async () => {
    await db.update(testData.accounts[0].twitter_id);
    let response = await db.read(testData.accounts[0].twitter_id);
    expect(response.address_index).equal(1);
  });

  it("Should throw error Otherwise", async () => {
    let response = await db.update(testData.accounts[0].twitter_id);
    console.log("Res", response);
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

  // it('Should throw error if the database does not have the specifed user', async () => {
  //   // await db.remove("abcdepqrst");
  //   // let response = await db.read("abcdepqrst");
  //   // expect(response).be.false;
  //   expect(db.remove("abcdepqrst")).to.throw(/Does not exist/);
  //   // expect(response.address_index).equal(0)
  // });
});

// describe('Returns the details of the specifed User', () => {
//   it('Should return the account object from the database that contains the specifed user', async () => {
//    let response = await db.read(testData.accounts[0].twitter_id);
//    console.log("Response===", response);
//     expect(response.address_index).equal(0);
//     expect(response.helix_seed).equal(testData.accounts[0].helix_seed);
//     expect(response.twitter_id).equal(testData.accounts[0].testData.accounts[0].twitter_id);

//   });

//   it('Should throw error Otherwise', async () => {
//     expect( db.update(testData.accounts[0].twitter_id)).to.throw();
//   });
// });
