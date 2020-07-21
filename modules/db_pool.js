const log = require('ulog');
const mongoose = require('mongoose');
const conf = require('../conf.json');

// MongoDB Connection Url
const connection_url =conf.db.host + conf.db.db_name;

// Connection variable
let connection;

/**
 * Creates a mongoDB connection pool with parallel connections specified in 
 * configuration file.
 */

async function connectionPool() {
  // if connection exists, return connection
try{

  if(connection){
    log.info('Existing connection found. Re using it')
    return connection;
  }
    log.info(`Connecting to MongoDB`)
    await mongoose.connect(connection_url,conf.db.options);
    log.info('Connected to MongoDB database')
    connection = mongoose.connection; 
    return connection

  }catch(err) {

    log.error("Could not connect to database=",err)
    // eslint-disable-next-line no-undef
    process.exit(1)

  }
}

module.exports = connectionPool
