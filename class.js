const path = require('path')
const fs = require('fs')
const request = require('request')
const parser = require('rss-parser')
const cheerio = require('cheerio')
const utils = require(path.join(__dirname, './utils.js'))

class RssToWeibo {
	constructor(config, logger) {
		if (!config || config instanceof Array) {
			console.error('config file err');
			return false;
		}
		this.config = config;
		this.const = {
			WB_POST: "https://api.weibo.com/2/statuses/share.json",
			ID_FILE: path.join(__dirname, `./tmp/lastid_${this.config.NAME}.txt`),
			TIME_OUT: 60 * 1000,
			CHECK_STEP: 60 * 1000,
			WB_POST_STEP: 3 * 1000,
		}
		this.logger = logger;
		if (!fs.existsSync(this.const.ID_FILE)) {
			fs.writeFileSync(this.const.ID_FILE, "");
		}
	}
	main() {
		let _this = this;
		try {
			_this.check()
		} catch (e) {
			_this.logger.error('main err', e)
		} finally {
			setTimeout(() => {
				_this.main()
			}, _this.const.CHECK_STEP)
		}
	}
	check() {
		let _this = this;
		parser.parseURL(_this.config.TW_RSS_URL, async function (err, parsed) {
			if (err) {
				_this.logger.error('get rss err', err)
				return;
			}
			let newRss = _this.getNewRss(parsed.feed.entries);
			console.log('newRss', newRss)
			let errFlag = false;
			for (let i = 0; i < newRss.length; i++) {
				if (errFlag) break;
				let v = newRss[i];
				let wb = v.weibo;
				let status = _this.config.DOMAIN ?
					`${wb.txt} ${ _this.config.DOMAIN}` : `${wb.txt} ${v.link}`;
				if (wb.imgs.length > 0) {
					// 如果包含图片的处理
					for (let j = 0; j < wb.imgs.length; j++) {
						if (errFlag) break;
						let img = wb.imgs[j]
						await _this.syncToWB('pic', status, img.url).then((body) => {
							if (j == wb.imgs.length - 1 && v.link) {
								fs.writeFileSync(_this.const.ID_FILE, v.link);
							}
						}).catch((err) => {
							//遇到错误退出 多半网络问题 等待下一个循环
							errFlag = true;
						});
						await _this.sleep(_this.const.WB_POST_STEP);
					}
				} else {
					// 纯文字的处理
					await _this.syncToWB('text', status).then((body) => {
						if (v.link) {
							fs.writeFileSync(_this.const.ID_FILE, v.link);
						}
					}).catch((err) => {
						//遇到错误退出 多半网络问题 等待下一个循环
						errFlag = true;
					});
					await _this.sleep(_this.const.WB_POST_STEP);
				}
			}
		})
	}

	/**
	 * 获取并组装新的 Rss json 对象。
	 * @method getNewRss
	 * @param  {Array}  rss 原始 Rss Json
	 * @return {Array}      含 Object weibo
	 */
	getNewRss(rss) {
		let _this = this;
		let newRss = [];
		let lastId = fs.readFileSync(_this.const.ID_FILE).toString().trim();
		for (let i = 0; i < rss.length; i++) {
			let v = rss[i];
			if (lastId == v.link) break;
			// 多标签判断
			let tagFlag = _this.config.TW_TAG.some((tag) => {
				return v.title.includes(tag)
			})
			if (_this.config.TW_TAG.length == 0 || tagFlag) {
				let $ = cheerio.load(v.content);
				v.weibo = {
					txt: v.title.replace(/\#/g, "♯"),
					imgs: []
				}
				$("img").each((i, imgDom) => {
					v.weibo.imgs.push({
						url: $(imgDom).attr('src')
					})
				})
				newRss.unshift(v);
			}
		}
		return newRss;
	}

	/**
	 * 同步至微博
	 * @method syncToWB
	 * @param  {string} status 微博API #详细查看 http://open.weibo.com/wiki/2/statuses/share
	 * @param  {[type]} picUrl [同上]
	 * @return {[type]}        [Promise]
	 */
	syncToWB(type, status, picUrl) {
		let _this = this;
		return new Promise((resolve, reject) => {
			let reqObj = { url: _this.const.WB_POST, timeout: _this.const.TIME_OUT }
			switch (type) {
			case 'text':
				reqObj.form = {
					access_token: _this.config.WB_AT,
					status: status,
				}
				break;
			case 'pic':
				reqObj.formData = {
					access_token: _this.config.WB_AT,
					status: status,
					pic: request.get(picUrl)
				}
				break;
			}
			request.post(reqObj, (err, res, body) => {
				if (!err && res.statusCode == 200) {
					_this.logger.info('post wb succ', status)
					resolve(body)
				} else {
					reject(err)
					_this.logger.error('post wb err', status, err, body)
				}
			})
		})
	}

	/**
	 * sleep
	 * @method sleep
	 * @param  {Number} step 等待时间
	 * @return {[type]}      Promise
	 */
	sleep(step) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, step)
		})
	}
}

module.exports = RssToWeibo;
