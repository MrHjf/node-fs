const express = require('express');
const multer = require('multer');
const queryString = require('query-string');
const fs = require('fs');
const os = require('os');

const app = express();
const root = 'd:';
const port = 3001;
var destPath = os.platform() === 'linux' ? '/home/myFile/' : 'd:\\file\\';

function getIpConfig() {
    var IPv4;
    if (process.platform === 'darwin') {
        for (var i = 0; i< os.networkInterfaces().en0.length;i++) {
            if (os.networkInterfaces().en0[i].family == 'IPv4') {
                IPv4 = os.networkInterfaces().en0[i].address;
            }
        }
    } else if (process.platform === 'win32') {
        for (var key in os.networkInterfaces()) {
            if (key.indexOf('本地连接') !== -1) {
                for (var i =0;i< os.networkInterfaces()[key].length;i++) {
                    if (os.networkInterfaces()[key][i].family == 'IPv4') {
                        IPv4 = os.networkInterfaces()[key][i].address;
                    }
                }
            }
        }
    } else if (process.platform === 'linux') {
	    for (var i = 0; i< os.networkInterfaces().ens3.length;i++) {
		                if (os.networkInterfaces().ens3[i].family == 'IPv4') {
					                IPv4 = os.networkInterfaces().ens3[i].address;
					            }
		            } 
    }
    return IPv4;
}

const host = getIpConfig();
console.log(host);

function createFolder(folder) {
    try {
        fs.accessSync(folder);
    } catch(e) {
        fs.mkdirSync(folder);
    }
}

createFolder(destPath);

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, destPath);
    },
    filename: function(req, file, cb) {
        const type = file.mimetype.replace('image/','');
        cb(null, file.fieldname + '-' + Date.now()+ '.'+type);
    }
})
const upload = multer({ storage: storage});

app.use('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, accept, origin, content-type");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    if (req.method === 'OPTIONS') res.send(200);
    else next();
})

app.post('/upload', upload.single('file'), function(req, res, next) {
    var file = req.file;
    console.log(req.file);
    console.log('文件类型：%s', file.mimetype);
    console.log('原始文件名：%s', file.originalname);
    console.log('文件大小：%s', file.size);
    console.log('文件保存路径：%s', file.path);
	 const dir = os.platform() === 'win32' ? '/file/' : '/home/myFile/';
    const imgUrl = 'http://' + host + ":" + port + dir + file.filename;
    res.send({ret_code: '0', img_url: imgUrl});
});

app.get(/^\/(file|home\/myFile)\/(.*)\.(png|jpg|gif|jpge)$/, function(req, res, next) {
    var path = Object.keys(queryString.parse(req.url))[0];
	if (os.platform() === 'win32') path = root + path;
    fs.stat(path, function(err, stats) {
        if (err) res.end('not found');
        else {
            const fileStream = fs.createReadStream(path);
            fileStream.pipe(res);
        }
    })
})

app.listen(port);
