# Rss2Weibo
将 rss 流同步到 微博. 如twitter facebook 等 RSS 流同步到微博
[Twitter to Rss](https://github.com/snarfed/twitter-atom)
[Facebook to Rss](https://github.com/snarfed/facebook-atom)
## 安装 Installation

```bash
git clone https://github.com/lqzhgood/Rss2Weibo.git
npm install
```

## Usage
1. 先去[微博开放平台](http://open.weibo.com/index.php) 申请一个应用【无需审核】,然后在[Api测试中](http://open.weibo.com/tools/console)获取开发者Access Token
2. [微博开放平台](http://open.weibo.com/index.php) 【应用信息】 添加 【安全域名】
3. 打开目录下的 *config.js* 填入配置
4. node *app.js* 执行






### config.js
config  多个配置组成的数组

| key    | type   |
|--------|-----  |
|NAME    |String | 配置的名称，仅用于标识及日志
|WB_AT   |String | Usage \*1 获取的 微博Access_Token
|TW_TAG  |Array  | 触发同步的关键词，若数组为空则同步所有到微博，允许多个关键词
|TW_RSS_URL|String | 监控的 RSS 地址
|DOMAIN  |String | Usage \*2 填写的【安全域名】 每条微博后会追加这个域名地址，需要 *http/https* 开头。若为空，则追加 RSS 条目地址

#### config.js Examples
``` javascript
[{
	NAME: 'test1',
	WB_AT: "******************************",
	TW_TAG: [],  // 将同步所有条目到微博
	TW_RSS_URL: "https://rss.rss",
	DOMAIN: '', // 追加条目的链接到同步的微博
}，{
	NAME: 'test2',
	WB_AT: "******************************",
	TW_TAG: ["#weibo"], // 仅同步包含 “#weibo” 关键词的条目到微博
	TW_RSS_URL: "https://rss.rss",
	DOMAIN: 'http://www.baidu.com', // 追加 百度首页的链接 到同步的微博条目中
}]

// DOMAIN 需和【微博开发者平台】->【我的应用】->【应用信息】->【安全域名】中匹配
```

## Important
- 由于微博限制，每条微博不得含有话题，原RSS的内容中所有 #号 会被替换为 [♯升号](https://baike.baidu.com/item/%E5%8D%87%E5%8F%B7/4824245)。
- 又是由于微博的限制，每条微博必须包含域名，且域名必须在【应用信息】的【安全域名】中。

``` bash
 例如如果的Rss是twitter某人的时间线，并且想让你同步后的微博附带跳转到twitter相应推文的链接，那么【应用信息】中的 【安全域名】 就填 twitter.com，config[DOMAIN]留空

 如果你的Rss的条目链接指向多个域名且无法控制，那么请用自己的域名建短链，然后【安全域名】填自己的短链域名， config[DOMAIN]留空

 如果你完全不明白我上面写的什么，【应用信息】中的 【安全域名】 填 www.baidu.com，config[DOMAIN]填http://www.baidu.com

```
- rss轮询时间为上一次循环完成的1分钟后
- 每条微博的发送间隔时间 3s ，防止发送过快被微博ban
- 为了保证时间线的正确性，从最老的不重复项开始发，如果中途出现错误，没有发送成功，则后续不会发送，到下一个循环重试。
