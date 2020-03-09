var os = require('os');
var cluster = require('cluster');
const port = 4000;

var imageExt = ['.png', '.jpg', '.ico', '.svg']

//var instance_id = uuid.v4();
 
/* 워커 생성 */
var cpuCount = os.cpus().length; //CPU 수
var workerCount = cpuCount/2; //2개의 컨테이너에 돌릴 예정 CPU수 / 2

if(cluster.isMaster)
{
    //console.log('서버 ID : '+instance_id);
    console.log('서버 CPU 수 : ' + cpuCount);
    console.log('생성할 워커 수 : ' + workerCount);
    console.log(workerCount + '개의 워커가 생성됩니다\n');
   
    //CPU 수 만큼 워커 생성
    for (var i = 0; i < workerCount; i++) {
        console.log("워커 생성 [" + (i + 1) + "/" + workerCount + "]");
        var worker = cluster.fork();
    }
   
    //워커가 online상태가 되었을때
    cluster.on('online', function(worker) {
        console.log('워커 온라인 - 워커 ID : [' + worker.process.pid + ']');
    });
   
    //워커가 죽었을 경우 다시 살림
    cluster.on('exit', function(worker) {
        console.log('워커 사망 - 사망한 워커 ID : [' + worker.process.pid + ']');
        console.log('다른 워커를 생성합니다.');
       
        var worker = cluster.fork();
    });
}
else if(cluster.isWorker)
{
    var http = require('http');
    var fs = require('fs');
    var path = require('path');
    var worker_id = cluster.worker.id;
    var master_id;

    http.createServer(function (request, response) {
        console.log(`server${worker_id} : `, 'request', request.url);
        
        var filePath = './page' + request.url;
        if (filePath == './page/')
            filePath = './page/index.html';
    
        // 확장자 없을 때 자동으로 .html 추가
        if(path.extname(filePath) === '')
        {
            filePath += '.html';
        }
    
        //console.log(filePath);
        var extname = String(path.extname(filePath)).toLowerCase();
        if(imageExt.indexOf(extname) !== -1)
        {
            filePath = './' + request.url;
        }
        var contentType = 'text/html';
        var mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.svg': 'application/image/svg+xml',
            '.ico': 'image/x-icon',
        };
    
        contentType = mimeTypes[extname] || 'application/octet-stream';
    
        fs.readFile(filePath, function(error, content) {
            if (error) {
                if(error.code == 'ENOENT'){
                    fs.readFile('./404.html', function(error, content) {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    });
                }
                else {
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                    response.end();
                }
            }
            else {
                
                if(extname === '.ico')
                {
                    response.writeHead(200, { 
                        'Content-Type': contentType, 
                        'Cache-Control': 'public, max-age=345600' ,
                        'accept-ranges': 'bytes',
                        'Content-length': content.length,
                    });
                    response.end(content, 'utf-8');
                }
                else
                {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            }
        });
    
    }).listen(port);
    console.log(`Server${worker_id} running at http://127.0.0.1:${port}/`);
}
