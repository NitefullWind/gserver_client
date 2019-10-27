var logger = require('./logger').getLogger("socket_server")
var GServer = require('./gserver')

/**
 * 创建一个WebSocket服务器，并将数据转发到Tcp服务器
 * @param {number} wsPort WebSocket server's port
 * @param {number} tsPort Tcp Server's port
 * @param {string} tsHost Tcp Server's host
 */
function SocketServer(wsPort, tsPort, tsHost="127.0.0.1") {
    var webSocket = require("socket.io")(wsPort)
        
    webSocket.on('connection', function(socket) {
        logger.debug("websocket connected")

        var tcpSocket = require('net').Socket()
        tcpSocket.connect(tsPort, tsHost, () => {
            logger.debug(`tcpsocket connecting to ${tsHost}:${tsPort}`)
        });

        socket.on('error', (error) => {
            logger.debug("websocket error: ", error)
        });

        socket.on('disconnecting', (reason) => {
            logger.debug("websocket disconnecting. reason: ", reason)
            tcpSocket.end()
        });

        socket.on('message', (data) => {
            logger.debug("websocket received message: ", data)

            tcpSocket.write(data, callback = () => {
                logger.debug("tcpsocket writen data: ", data)
            })
        });

        socket.on('gserver_data', (cmd, data) => {
            let dataArray = new Uint8Array(data);
            tcpSocket.write(GServer.encodeData(cmd, new Buffer(dataArray)))
        })

        tcpSocket.on('close', (hadError) => {
            if(hadError) {
                logger.debug("tcpsocket closed by error")
            } else {
                logger.debug("tcpsocket closed")
            }
            socket.disconnect(true)
        });

        tcpSocket.on('connect', () => {
            logger.debug("tcpsocket connected")
            socket.emit('connect_tcp')
        });

        tcpSocket.on('data', (data) => {
            logger.debug("tcpsocket receive data: ", data)
            let gserverData = GServer.decodeData(data)
            let header = gserverData.header
            let message = gserverData.message
            logger.debug("Header:", header)
            logger.debug("Message:", message)
            socket.emit('gserver_data', header.rspcode, header.cmd, message)
        });

        tcpSocket.on('error', (error) => {
            logger.debug("tcpsocket error: ", error)
        });

        tcpSocket.on('end', () => {
            logger.debug("tcpsocket end")
        });
    });


}

module.exports = SocketServer