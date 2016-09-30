/***
 * 使用superagent获取源数据、使用cheerio解析、使用eventproxy来并发抓取每个主题的内容等方面
 */

//region 依赖
var express = require('express');
var url = require('url');// url 模块是 Node.js 标准库里面的
var superagent = require('superagent');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
//endregion


var targeUrl = 'https://cnodejs.org/';
var Color = require("color");


var topicUrls = [];


superagent.get(targeUrl)
  .end(function (err, res) {
    if (err) {
      return console.error(err);
    }
    var $ = cheerio.load(res.text);

    //region 获取topicUrls
    $('#topic_list .topic_title').each(function (idx, element) {

      var random = parseInt((Math.random() * 10000000) % 10, 10);
      if (idx >= random)return;
      var $element = $(element);
      var href = url.resolve(targeUrl, $element.attr('href'));
      topicUrls.push(href);
    });
    //endregion

    var ep = new eventproxy();

    //region 循环请求每个topic
    topicUrls.forEach(function (topicUrl) {
      superagent.get(topicUrl)
        .end(function (err, res) {
          if (err) {
            // return console.error(err);
            console.error("请求失败");
          } else {
            console.log('fetch ' + topicUrl + ' successful');
            //广播这一次成功
          }
          ep.emit('topic_html', [topicUrl, res.text]);
        });
    });
    //endregion

    //region 重复监听广播,当全部监听到后执行
    ep.after('topic_html', topicUrls.length, function (topics) {
      topics = topics.map(function (topicPair) {
        var topicUrl = topicPair[0];
        var topicHtml = topicPair[1];
        var $ = cheerio.load(topicHtml);
        return ({
          title: $('.topic_full_title').text().trim(),
          href: topicUrl,
          comment1: $('.reply_content').eq(0).text().trim()
        });
      });
      console.log('outcome:');
      console.log(topics);
    });
    //endregion


  });


// var app = express();
// app.get('/', function (req, res, next) {
//   // 用 superagent 去抓取 https://cnodejs.org/ 的内容
//   superagent.get('https://cnodejs.org/')
//     .end(function (err, sres) {
//       // 常规的错误处理
//       if (err) {
//         return next(err);
//       }
//       // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
//       // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
//       // 剩下就都是 jquery 的内容了
//       var $ = cheerio.load(sres.text);
//       var items = [];
//       $('#topic_list .topic_title').each(function (idx, element) {
//         var $element = $(element);
//         items.push({
//           title: $element.attr('title'),
//           href: $element.attr('href')
//         });
//       });
//
//       res.send(items);
//     });
// });
//
// app.listen(3010, function () {
//   console.log('app is listening at port 3010');
// });
//
// var open = require('open');
// open('http://localhost:3010');