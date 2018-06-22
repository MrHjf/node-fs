const express = require('express');
const fs = require('fs');
const path = require('path');
const url = require('url');
const ejs = require('ejs');
const queryString = require('query-string');

const app = express();

// app.use(express.static("public"));

app.use('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, accept, origin, content-type");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    if (req.method === 'OPTIONS') res.send(200);
    else next();
});

app.post('/upload/file', function(req, res, next) {
    req.setEncoding('binary');
    let body = '', filename = '', file = null;
    const boundary = req.headers['content-type'].split(';')[1].replace('boundary=', '');
    req.on('data', function(chunk){
        body += chunk;
    })

    req.on('end', function() {
        file = body.split('\r\n');
        let content = null, disposition = null;
        for (let i in file) {
            if (content && disposition) break;
            if (file[i].indexOf('Content-Type') !== -1) {
                content = file[i]
            }
            if (file[i].indexOf('Content-Disposition') !== -1) {
                disposition = file[i];
            }
        }
        // file = queryString.parse(body, '\r\n', ':');
        if (content.indexOf("image") !== -1) {
            let fileInfo = disposition.split('; ');
            for(let value in fileInfo) {
                if (fileInfo[value].indexOf('filename') !== -1) {
                    filename = fileInfo[value].replace(/filename="(.*)"/, "$1");
                    console.log('filename: ', filename);
                }
            }
            let entireData = body.toString();
            const contentTypeRegx = /Content-Type: image\/.*/;
            const contentType = content.substring(1);

            const upperBoundary = entireData.indexOf(contentType) + contentType.length;
            const shorterData = entireData.substring(upperBoundary);

            // 替换开始位置的空格
            var binaryDataAlmost = shorterData.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

            // 去除数据末尾的额外数据，即: "--"+ boundary + "--"
            binaryDataAlmost = binaryDataAlmost.substring(0, binaryDataAlmost.indexOf('------'+boundary+'--'));

            // 保存文件
            fs.writeFile(filename, binaryDataAlmost, 'binary', function(err) {
                res.end('图片上传完成');
            });
        } else {
            res.end('只能上传图片');
        }
    })


})

app.get(/\/file\/.*[jpg|gif|png|jpge]/, function(req, res, next) {
    const pathName = path.join(__dirname, 'dist', req.url.split('/').pop());
    fs.stat(pathName, (err, stats) => {
        if (err) res.end('not found');
        else {
            const readStream = fs.createReadStream(pathName);
            readStream.pipe(res);
        }
    })
});

function compileHtml() {
    const rootPath = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
    return ejs.compile(rootPath);
}

app.listen(3000, () => console.log(`node file-system running on http://localhost:3000`));