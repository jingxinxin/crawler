var async = require('async');
var express = require('express');

var app = express();
app.get('/', function (req, res, next) {

// 并发连接数的计数器
  var concurrencyCount = 0;
  var fetchUrl = function (url, callback) {
    // delay 的值在 2000 以内，是个随机的整数
    var delay = parseInt((Math.random() * 10000000) % 2000, 10);
    concurrencyCount++;
    console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒');
    setTimeout(function () {
      superagent.get(url)
        .end(function (err, res) {
          if (err) {
            console.error("请求失败");
          } else {
            console.log('fetch ' + url + ' successful');
            callback(null, [url, res.text]);
          }
        });
      concurrencyCount--;
    }, delay);
  };


  var superagent = require('superagent');
  var cheerio = require('cheerio');
  var url = require('url');// url 模块是 Node.js 标准库里面的

  var targeUrl = 'https://cnodejs.org/';

  var topicUrls = [];
  superagent.get(targeUrl)
    .end(function (err, superagent_res) {
      if (err) {
        return console.error(err);
      }
      var $ = cheerio.load(superagent_res.text);

      //region 获取topicUrls
      $('#topic_list .topic_title').each(function (idx, element) {
        var $element = $(element);

        var href = url.resolve(targeUrl, $element.attr('href'));
        topicUrls.push(href);
      });

      async.mapLimit(topicUrls, 5, function (url, callback) {
        fetchUrl(url, callback);
      }, function (err, result) {
        result = result.map(function (topicPair) {
          var topicUrl = topicPair[0];
          var topicHtml = topicPair[1];
          var $ = cheerio.load(topicHtml);
          return ({
            title: $('.topic_full_title').text().trim(),
            href: topicUrl,
            comment1: $('.reply_content').eq(0).text().trim()
          });
        });
        console.log('final:');
        // console.log(result);
        // res.send(result);
      });
    });

});

app.listen(3010, function () {
  console.log('app is listening at port 3010');
});

var open = require('open');
open('http://localhost:3010');