const cmd = require("./modules/commands.js");
const db = require("./modules/db.js");

//console.log(cmd.help());
//console.log(cmd.terms());
//cmd.register("_nyan1337");
//cmd.register("test3132");
//cmd.register("test3134");
//cmd.register("test3135");
//cmd.register("test3136");
//cmd.register("test3137");
//cmd.deregister("_nyan1337");

//db.update("_nyan1337");

//db.update("test3132");
let read = db.read("_nyan1337");
console.log(read);


        String.prototype.expand = function (values) {
        var global = {
            nick: settings.twitter.twittername
        }
        return this.replace(/%([a-zA-Z_]+)%/g, function (str, variable) {
            return typeof (values[variable]) == 'undefined' ?
                    (typeof (settings.coin[variable]) == 'undefined' ?
                            (typeof (global[variable]) == 'undefined' ?
                                    str : global[variable]) : settings.coin[variable]) : values[variable];
        });
    }
    client.stream('statuses/filter', {track: settings.twitter.twitterkeyword}, function (stream) {
          stream.on('error', function(error) {
            winston.error('Something went wrong with the twitter streaming api. ');
           });
  stream.on('end', function(reason) {
                    winston.error('Twitter streaming api throws end');
  });
        stream.on('data', function (tweet) {
            console.log('@'+ tweet.user.screen_name + '|' + tweet.text);
            if ((tweet.text).substring(0,2) == "RT"){
                    console.log("Retweet Ingrored");
                    return;
                }
            var regex= new RegExp("(" + settings.twitter.twitterkeyword + ")(\\s)([a-zA-Z]+)", "i");
            var match = tweet.text.match(regex);
            if (match == null)
                return;
            var command = match[3];
            var from = tweet.user.screen_name;
            var msg = tweet.txt;
            var message = tweet.text;
            var replyid = tweet.id_str;

            if(command == 'help' || command == 'terms') {
                for(var i = 0; i < settings.messages[command].length; i++) {
                    replytweet(from, replyid, settings.messages[command][i].expand({}));
                }
            return;
            }

            switch (command) {
                case 'tip':
                var regex = new RegExp("(" + settings.twitter.twitterkeyword + ")(\\s)([a-zA-Z]+)(\\s)(\\@)(.+)(\\s)(.+)", "i"); //Uglyfix
                    var match = tweet.text.match(regex);
                    console.log('tip');
                    console.log(match[0] + ',' + match[1] + ',' + match[2] + ',' + match[3] + ',' + match[4] + ',' + match[5] + ',' + match[6] + ',' + match[7] + ',' + match[8]);
                    if (match == null || match.length < 3) {
                        replytweet(from, replyid, 'Usage: nameofbot tip <twitterhandle> <amount>')
                        return;
                    }
                    var to = match[6];
                    var amount = Number(match[8]);
                    console.log('To:' + amount);
                    // lock
                    if (locks.hasOwnProperty(from.toLowerCase()) && locks[from.toLowerCase()])
                        return;
                    locks[from.toLowerCase()] = true;

                    if (isNaN(amount)) {
                        locks[from.toLowerCase()] = null;
                        replytweet(from, replyid, settings.messages.invalid_amount.expand({name: from, amount: match[8]}));
                        return;
                    }

                    if (to.toLowerCase() == from.toLowerCase()) {
                        locks[from.toLowerCase()] = null;
                        replytweet(from, replyid, settings.messages.tip_self.expand({name: from}));
                        return;
                    }
                    if (amount < settings.coin.min_tip) {
                        locks[from.toLowerCase()] = null;
                        replytweet(from, replyid, settings.messages.tip_too_small.expand({from: from, to: to, amount: amount}));
                        return;
                    }
    // check balance with min. 5 confirmations
                    coin.getBalance(settings.rpc.prefix + from.toLowerCase(), settings.coin.min_confirmations, function (err, balance) {
                        if (err) {
                            locks[from.toLowerCase()] = null;
                            winston.error('Error in !tip command.', err);

                            replytweet(from, replyid, settings.messages.error.expand({name: from}));
                            return;
                        }
                        var balance = typeof (balance) == 'object' ? balance.result : balance;
                        if (balance >= amount) {
                            coin.send('move', settings.rpc.prefix + from.toLowerCase(), settings.rpc.prefix + to.toLowerCase(), amount, function (err, reply) {
                                locks[from.toLowerCase()] = null;
                                if (err || !reply) {
                                    winston.error('Error in !tip command', err);
                                    replytweet(from, replyid, settings.messages.error.expand({name: from}));
                                    return;
                                }
                                winston.info('%s tipped %s %d%s', from, to, amount, settings.coin.short_name)
                                replytweet(from, replyid, settings.messages.tipped.expand({from: from, to: to, amount: amount}));
                            });
                        } else {
                            locks[from.toLowerCase()] = null;
                            winston.info('%s tried to tip %s %d, but has only %d', from, to, amount, balance);
                            replytweet(from, replyid, settings.messages.no_funds.expand({name: from, balance: balance, short: amount - balance, amount: amount}));
                        }
                    });
                    break;
                case 'address':
                    console.log('adress');
                    var user = from.toLowerCase();
                    getAddress(user, function (err, address) {
                        if (err) {
                            winston.error('Error in !address command', err);
                            replytweet(from, replyid, settings.messages.error.expand({name: from}));
                            return;
                        }
                        replytweet(from, replyid, settings.messages.deposit_address.expand({name: user, address: address}));
                    });
                    break;
                case 'balance':
                    console.log('balance');
                    var user = from.toLowerCase();
                    coin.getBalance(settings.rpc.prefix + user, settings.coin.min_confirmations, function (err, balance) {
                        if (err) {
                            winston.error('Error in !balance command', err);
                            replytweet(from, replyid, settings.messages.error.expand({name: from}));
                            return;
                        }
                        var balance = typeof (balance) == 'object' ? balance.result : balance;
                        coin.getBalance(settings.rpc.prefix + user, 0, function (err, unconfirmed_balance) {
                            if (err) {
                                winston.error('Error in !balance command', err);
                                replytweet(from, replyid, settings.messages.balance.expand({balance: balance, name: user}));
                                return;
                            }
                            var unconfirmed_balance = typeof (unconfirmed_balance) == 'object' ? unconfirmed_balance.result : unconfirmed_balance;
                            replytweet(from, replyid, settings.messages.balance_unconfirmed.expand({balance: balance, name: user, unconfirmed: unconfirmed_balance - balance}));
                        })
                    });
                    break;
                case 'withdraw':
                    console.log('withdrawl');
                    var user = from.toLowerCase();
                    var match = message.match(/.?withdraw (\S+)$/);
                    if (match == null) {
                        replytweet(from, replyid, 'Usage: !withdraw <' + settings.coin.full_name + ' address>');
                        return;
                    }
                    var address = match[1];
                    coin.validateAddress(address, function (err, reply) {
                        if (err) {
                            winston.error('Error in !withdraw command', err);
                            replytweet(from, replyid, settings.messages.error.expand({name: from}));
                            return;
                        }
                        if (reply.isvalid) {
                            coin.getBalance(settings.rpc.prefix + from.toLowerCase(), settings.coin.min_confirmations, function (err, balance) {
                                if (err) {
                                    winston.error('Error in !withdraw command', err);
                                    replytweet(from, replyid, settings.messages.error.expand({name: from}));
                                    return;
                                }
                                var balance = typeof (balance) == 'object' ? balance.result : balance;
                                if (balance < settings.coin.min_withdraw) {
                                    winston.warn('%s tried to withdraw %d, but min is set to %d', from, balance, settings.coin.min_withdraw);
                                    replytweet(from, replyid, settings.messages.withdraw_too_small.expand({name: from, balance: balance}));
                                    return;
                                }
                                coin.sendFrom(settings.rpc.prefix + from.toLowerCase(), address, balance - settings.coin.withdrawal_fee, function (err, reply) {
                                    if (err) {
                                        winston.error('Error in !withdraw command', err);
                                        replytweet(from, replyid, settings.messages.error.expand({name: from}));
                                        return;
                                    }
                                    var values = {name: from, address: address, balance: balance, amount: balance - settings.coin.withdrawal_fee, transaction: reply}
                                    for (var i = 0; i < settings.messages.withdraw_success.length; i++) {
                                        var msg = settings.messages.withdraw_success[i];
                                        replytweet(from, replyid, msg.expand(values));
                                    }
                                    ;
    // transfer the rest (withdrawal fee - txfee) to bots wallet
                                    coin.getBalance(settings.rpc.prefix + from.toLowerCase(), function (err, balance) {
                                        if (err) {
                                            winston.error('Something went wrong while transferring fees', err);
                                            return;
                                        }
                                        var balance = typeof (balance) == 'object' ? balance.result : balance;
    // moves the rest to bot's wallet
    					coin.move(settings.rpc.prefix + from.toLowerCase(), settings.rpc.prefix + settings.twitter.twittername.toLowerCase(), balance);
                                    });
                                });
                            });
                        } else {
                            winston.warn('%s tried to withdraw to an invalid address', from);
                            replytweet(from, replyid, settings.messages.invalid_address.expand({address: address, name: from}));
                        }
                    });
                    break;
                default:
                    winston.warn("Invalid Command" + command);
                    break;
            }
        });
    });
