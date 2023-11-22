// node servez C:\projects\rpg_combat\src

// Use "lite-server" from packages for hot reload on js changes
import {WebSocketServer} from "ws";
import {createServer} from 'node:http'
import {readFile} from 'node:fs'
import {extname} from 'node:path'
const ws = WebSocketServer.Server;

const port = process.env.PORT || 8080;
import {ServerMain} from "./Server/ServerMain.js";
let serverMain = new ServerMain();

let server = createServer(

    function (request, response)
    {
    console.log('request starting...');

    //    import * as SERVER from "./Server/ServerMain.js";

    let filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';

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
            if(error.code == 'ENOENT'){
                readFile('./404.html', function(error, content) {
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
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
            console.log('response - Content-Type:'+contentType);
        }
    });
}

).listen(port);

let wss = new WebSocketServer({server: server});

serverMain.initServerConnection(wss);

console.log('Server running at port: '+port);

