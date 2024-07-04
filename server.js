
import {WebSocketServer} from "ws";
import {createServer} from 'node:http';
import {readFile} from 'node:fs';
import {writeFile} from 'node:fs';
import {existsSync} from 'node:fs';
import {mkdirSync} from 'node:fs';
import {readdirSync} from 'node:fs';
import {lstatSync} from 'node:fs';
import {readdir} from 'node:fs';
import {lstat} from 'node:fs';
import {extname} from 'node:path';
import {resolve} from 'node:path';
const ws = WebSocketServer.Server;

const port = process.env.PORT || 8080;
import {ServerMain} from "./Server/ServerMain.js";
let serverMain = new ServerMain();

let server = createServer(

    function (request, response)
    {
 //   console.log('request starting...');

    //    import * as SERVER from "./Server/ServerMain.js";

    let filePath = '.' + request.url;
    if (filePath.length === 2 || filePath[2] === '?') {
        filePath = './index.html';
    }


        let ext = extname(filePath);
        let contentType = 'text/html';
    switch (ext) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.wasm':
            contentType = 'application/wasm';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    readFile(filePath, function(error, content) {
        if (error) {
            console.log("Read File error ", filePath, error, content)
            if(error.code === 'ENOENT'){
                readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            } else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end();
            }
        } else {

            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            response.setHeader('Cross-origin-Embedder-Policy', 'require-corp');
            response.setHeader('Cross-origin-Opener-Policy','same-origin');
            response.setHeader('Access-Control-Max-Age', 60*60*24*30);
            response.setHeader('Content-Type', contentType);
            response.setHeader('Cache-control', 'max-age=360000, must-revalidate')
            // response.writeHead(200, {                'Content-Type': contentType             });
            response.end(content, 'utf-8');
         //   console.log('response - Content-Type:'+contentType);
        }
    });
}

).listen(port);

server.writeFile = writeFile;
server.readFile = readFile;
server.existsSync = existsSync;
server.mkdirSync = mkdirSync;
server.readdirSync = readdirSync;
server.lstatSync = lstatSync;
server.resolvePath = resolve;
server.lstat = lstat;
server.readdir = readdir;

let wss = new WebSocketServer({server: server});

serverMain.initServerConnection(wss, server);

console.log('Server running at port: '+port);

