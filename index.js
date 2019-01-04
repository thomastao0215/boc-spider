var request = require('request'),
    cheerio = require('cheerio'),
    fs = require("fs"),
    browserSync = require("browser-sync").create();
    const accountSid = 'ACdde1bc55832859ed458dbe5f348baa09';
    const authToken = '260e1da57098be5b8568b0595287ddce';
    const client = require('twilio')(accountSid, authToken);
    var schedule = require('node-schedule');
    var rule2     = new schedule.RecurrenceRule();
    var times2    = [1,5,9,13,17,
                     21,25,29,33,37,
                     41,45,49,53,57
                    ];
    rule2.minute  = times2;

var arryData = [],
    finished=true,
    pageNumber = 1,
    maxNumber = 11


        // 前台展示数据
        browserSync.init({
            server: "./app",
            browser: "google chrome"
        });

// Callback of the simplified HTTP request client
function reqCallback(err, response, body) {
    if (!err && response.statusCode == 200) {
        // 解析数据
        var $ = cheerio.load(body),
            $tr = $('.BOC_main tr'),
            $child = '', arryTmp = [],
            i = 1, len = $tr.length - 1;

        for (i; i < len; i++) {
            $child = $tr.eq(i).children();

            arryTmp.push(Number($child.eq(1).text())) // 现汇买入
            arryTmp.push(Number($child.eq(2).text())) // 现钞买入
            arryTmp.push(Number($child.eq(3).text())) // 现汇卖出
	    arryTmp.push(Number($child.eq(4).text())) // 现汇卖出
	    arryTmp.push(Number($child.eq(5).text())) //中行折算
            arryTmp.push($child.eq(6).text()) // 发布时间

            arryData.push(arryTmp)
            arryTmp = []
        }


        fetchInfo()
    }
}

function sendMessage(body){
  client.messages
        .create({
           body: body,
           from: '+19164618393',
           to: '+8618058709113'
         })
        .then(message => console.log(message.sid+message.body))
        .done();

}

// 请求数据
function fetchInfo() {
    if (pageNumber < maxNumber) {
        //console.log('读取第'+ pageNumber +'页数据...');
        request({
            url: 'http://srh.bankofchina.com/search/whpj/search.jsp',
            method: 'POST',
            form: {
                pjname: 1314,
                page: pageNumber++
            }
        }, reqCallback)
    } else {
        // 保存数据
        console.log(JSON.stringify(arryData[0]))
        if (arryData[0][0]>870 || arryData[0][2] <865){
            var message = arryData[0][5]+"现汇买入价格："+arryData[0][0]+"---现汇卖出价格："+arryData[0][2]
            sendMessage(message)
          }


        fs.writeFile('./app/data.json', JSON.stringify(arryData), function(err) {
            if (err) throw err;
            console.log(new Date())
            console.log('数据保存成功');
        })


        return
    }
}


schedule.scheduleJob(rule2, function(){
    arryData = []
    fetchInfo()
  });
