const { expect } = require("chai");

const { toLower } = require("lodash");
const currency = require("../modules/currency");
const testData = require("./test-data/testData.json");

const CONVERSION_TABLE = {
  $hlx: 1,
  $khlx: 1000,
  $mhlx: 1000000,
  $ghlx: 1000000000,
  $thlx: 1000000000000,
};

describe("Converts unit to equivalent HLX", () => {
  it("Should be false if not unit cannot be converted", async () => {
    // await currency.convertToHLX('1', '$mhlx');
    let response = await !CONVERSION_TABLE[toLower("$mhlx")];
    expect(response).to.be.false;
    // expect(response.address_index).equal(0)
  });

  it("Should return valid converted value for the given unit", async () => {
    // await currency.convertToHLX('1', '$mhlx');
    let response = await CONVERSION_TABLE[toLower("$mhlx")];
    expect(response).equal(1000000);
    // expect(response.address_index).equal(0)
  });
});

describe("Create random hexadecimal seed", () => {
  it("Should return hexadecimal string", async () => {
    let response = await currency.generateSeed(256, 32);
    // assert.match(response, /[0-9a-f]{32}/)
    expect(response).to.match(/[0-9a-f]{32}/);
  });
});

describe("Create a helix public key for a specifiable index using the seed", () => {
  it("Should generate public key", async () => {
    let response = await currency.generateAddr(
      testData.accounts[0].helix_seed,
      0
    );
    expect(response).to.match(/[0-9a-f]{72}/);
  });
});

describe("Get all balance of the given seed", () => {
  it("Should show balance", function (done) {
    this.timeout(10000);
    let response = currency.getBalances(testData.accounts[0].helix_seed, 100);
    console.log("BALANCE=", response);
    done();
  });

  it("return human readable balance", function (done) {
    this.timeout(10000);
    let response = currency.getBalancesWithUnit(
      testData.accounts[0].helix_seed,
      100
    );
    console.log("BAL+UNIT===", response);
    done();
  });

  // it("return human readable balance", async () => {
  //   let response = await currency.getBalancesWithUnit(testData.accounts[0].helix_seed, 100);

  // })
});

// describe("Transfer Helix", () => {
//   it("Should return hexadecimal string", function (done) {
//     this.timeout(10000);
//     let response = currency.transfer(testData.accounts[0].helix_seed, 1, '7dc95007baf05246ab0cb10884f41d9387aa0187a83a8c1523b2fe73912d0b90981de79c', 0, unit="$mHLX", message="helloworld", tag="1337" );
//     console.log("Respose transfer===", response);
//     // expect(response).to.match(/[0-9a-f]{32}/);
//     done();
//   });
// });
