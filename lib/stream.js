/*jshint node:true*/
/*
 * Sets up a real stream + attaches it to a server
 */
module.exports.attach = function droneStream(server, options) {
    'use strict';
    var WebSocketServer = require('ws').Server,
        wss = new WebSocketServer({server: server, path: '/dronestream'}),
        sockets = [],
        Parser = require('./PaVEParser'),
        arDrone = require('ar-drone');

    options = options || {};
    options.timeout = options.timeout || 4000;
    function init() {

        var tcpVideoStream = new arDrone.Client.PngStream.TcpVideoStream(options),
            p = new Parser();

        console.log("Connecting to drone on %s", options.ip || "192.168.1.1");

        tcpVideoStream.connect(function () {
            tcpVideoStream.pipe(p);
        });

        tcpVideoStream.on('error', function (err) {
            console.log('There was an error: %s', err.message);
            tcpVideoStream.end();
            tcpVideoStream.emit("end");
            init();
        });

        p.on('data', function (data) {
            sockets.forEach(function (socket) {
                socket.send(data, {binary: true});
            });
        });
    }
    init();

    wss.on('connection', function (socket) {
        console.log('connect');
        sockets.push(socket);

        socket.on("close", function () {
            console.log("Closing socket");
            sockets = sockets.filter(function (el) {
                return el !== socket;
            });
        });
    });
};
