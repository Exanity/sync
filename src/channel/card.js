var Config = require("../config");
var ChannelModule = require("./module");
var fs = require("fs");
var pug = require('pug');
var XSS = require("../xss");
import { ValidationError } from '../errors';
import Config from '../config';
import { ackOrErrorMsg } from '../util/ack';

const jsonfile = Config.get("card-json");
const GIRLS = (fs.existsSync(jsonfile)) ? JSON.parse(fs.readFileSync(jsonfile, 'UTF-8')) : false;


function CardModule(_channel) {
    ChannelModule.apply(this, arguments);

    if (this.channel.modules.chat) {
        this.channel.modules.chat.registerCommand("/card", this.handleCardCmd.bind(this));
    }
    this.supportsDirtyCheck = true;
}

CardModule.prototype = Object.create(ChannelModule.prototype);


CardModule.prototype.handleCardCmd = function (user, msg, meta) {
    if (GIRLS == false) {
        var obj = {
            username: '[server]',
            msg: "Sorry, can't find the json file: " + jsonfile,
            meta: meta,
            time: Date.now()
        };
        this.channel.broadcastAll("chatMsg", obj);
        return;
    }

    var commandMsg = msg;
    var args = msg.split(" ");
    args.shift();
    msg = "";

    args.forEach(function (id) {
      let girlObj = GIRLS[id];
      girlObj.name = girlObj.name.replace(/( \(.*?\))/, '');
      girlObj.debuted = girlObj.debuted.replace(/(.*? \/ )/, '');
      girlObj.groupClass = girlObj.group.replace(/[0-9]/g, '').toLowerCase();
      girlObj.groupClass = (girlObj.groupClass == 'nogizaka') ? 'nogi' : girlObj.groupClass
      girlObj.groupClass = (girlObj.groupClass == 'keyakizaka') ? 'keya' : girlObj.groupClass
      girlObj.graduated = (girlObj.graduated == 'N/A') ? false : true;
      girlObj.team = girlObj.team.replace(/ (Key.*)/g, ''); 
      msg = msg + pug.renderFile('templates/card.pug', girlObj);
    });


    var obj = {
        username: user.getName(),
        msg: msg,
        meta: meta,
        time: Date.now()
    };

    this.channel.broadcastAll("chatMsg", obj);

    this.channel.modules.chat.dirty = true;
    this.channel.modules.chat.buffer.push(obj);
    if (this.channel.modules.chat.buffer.length > 15) {
        this.channel.modules.chat.buffer.shift();
    }


    this.channel.logger.log("<" + user.getName() + (meta.addClass ? "." + meta.addClass : "") + "> " + XSS.decodeText(commandMsg));
};

module.exports = CardModule;
