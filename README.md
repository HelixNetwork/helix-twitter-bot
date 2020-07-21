# Helix Twitter Bot<img align="right" src="https://hlx.ai/images/Helix_Logo-white.svg" height="70px" />
The Helix Twitter Bot allows users to tip the HLX cryptocurrency using their Twitter handle.

## Prerequisites

- Registered twitter developer account. If not, you can signup for a twitter developer account at [here](developer.twitter.com)
- Register your app at [here](https://developer.twitter.com/en/apps). Generate Consumer API and Access token APIs keys with access level for read, write and direct messages
- Set up dev enviornments and associate your dev enviornments with your app [here](https://developer.twitter.com/en/account/environments) for Account Activity API Sandbox.
- Create a conf.json file based on the example_conf.json file in the root of the project. Keep in mind not to commit it to the repo.
- Also set up your twitter credentials in your server in one of the methods as specified [here](https://www.npmjs.com/package/twitter-autohook) for DM functionality with twitter-autohook.
- Nodejs ^10

## How to Install and Run the application
```
 npm install
 npm start
```


## Commands
The following commands are processed by tweeting `@HelixTipBot`.

- `!help`: Returns the list of available commands and provides information for usage.
- `!register`: Creates or validates an existing account id. This request returns an account address, that you can deposit to.
- `!deregister`: Removes your acccount from the database.
- `!account`: Returns account information, including balance and account id.
- `!withdraw`: Withdraws a specifiable amount of your Twitter account to an Helix account, e.g. `@HelixTipBot !withdraw d9e69197b18aab07afac20c5ebea3f2c6d1303670a28b9d75d1d355e15b7a003 5`.
- `!tip`: Tip HLX to a Twitter user, e.g.`@HelixTipBot !tip @nyan_1337 3` will tip 3 HLX to the user `@nyan_1337`.


## TODO
1. Bot should be reachable via DMs: Implement webhook for DM. All commands should be reachable via DM, especially commands like !withdraw shouldn't be public.
2. `<amount>` for `!tip` and `!withdraw` should be specified in `$mHLX`
3. Better UX: error messages/exception handling
4. db connection pool
5. Unit Tests
6. Review
