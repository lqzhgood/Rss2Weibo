/**
 * 微博APi http://open.weibo.com/wiki/index.php?title=%E5%BE%AE%E5%8D%9AAPI&oldid=11986
 *
 */
const path = require('path')
const log4js = require('log4js')

const config = require(path.join(__dirname, './config.js'))
const RssToWeibo = require(path.join(__dirname, './class.js'))
const utils = require(path.join(__dirname, './utils.js'))


let loggerObj = {
	appenders: {
		console: { type: 'console' }
	},
	categories: {
		default: { appenders: ['console'], level: 'debug' }
	}
}


for (let i = 0; i < config.length; i++) {
	let cfg = config[i];
	loggerObj.appenders[cfg.NAME] = { type: 'file', filename: `./log/${utils.DateFormart("yyyyMMdd")}_${cfg.NAME}.log`, maxLogSize: 1024 * 1024 * 1000 };
	loggerObj.categories[cfg.NAME] = { appenders: [cfg.NAME], level: 'debug' };
	log4js.configure(loggerObj);
	let a = new RssToWeibo(cfg, log4js.getLogger(cfg.NAME));
	a.main();
}
