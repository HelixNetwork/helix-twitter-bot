# Helix Twitter Bot<img align="right" src="https://hlx.ai/images/Helix_Logo-white.svg" height="70px" />
The Helix Twitter Bot allows users to tip the HLX cryptocurrency using their Twitter handle.

## Prerequisites

- Registered twitter developer account. If not, you can signup for a twitter developer account at [here](developer.twitter.com)
- Register your app at [here](https://developer.twitter.com/en/apps). Generate Consumer API and Access token APIs keys with access level for read, write and direct messages
- Set up dev enviornments and associate your dev enviornments with your app [here](https://developer.twitter.com/en/account/environments) for Account Activity API Sandbox.
- Also set up your twitter and other secrets  in your server by sourcing the env variables as mentioned in the example.env file in the root of the repo
- Nodejs ^10

## How to Install and Run the application
```
 npm install
 npm start
```

## Running Docker Image
```
# Build the docker image
docker build -t <your username>/helix-twitter-bot .

# Run the docker image
docker run -p 8966:8966 -d -e "TWITTER_CONSUMER_KEY="  -e "TWITTER_CONSUMER_SECRET=" -e "TWITTER_ACCESS_TOKEN=" -e "TWITTER_ACCESS_TOKEN_SECRET=" -e "TWITTER_WEBHOOK_ENV=" -e "MONGO_DB_URL=" -e "PROVIDER_ADDRESS=" <your username>/helix-twitter-bot 
```


## Commands
The following commands are processed by tweeting `@HelixTipBot`.

- `!help`: Returns the list of available commands and provides information for usage.
- `!register`: Creates or validates an existing account id. This request returns an account address, that you can deposit to.
- `!deregister`: Removes your acccount from the database.
- `!account`: Returns account information, including balance and account id.
- `!withdraw`: Withdraws a specifiable amount of your Twitter account to an Helix account, e.g. `@HelixTipBot !withdraw d9e69197b18aab07afac20c5ebea3f2c6d1303670a28b9d75d1d355e15b7a003 5`.
- `!tip`: Tip HLX to a Twitter user, e.g.`@HelixTipBot !tip @nyan_1337 3` will tip 3 HLX to the user `@nyan_1337`.
