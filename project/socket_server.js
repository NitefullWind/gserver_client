var logger = require('./logger').getLogger("socket_server")
var GServer = require('./gserver')
var PlayerPB = require('./proto/playerpb_pb')

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
            
            let player = new PlayerPB.PlayerPB()
            player.setName(socket.id)

            tcpSocket.write(GServer.encodeData(GServer.Command.LOGIN, player.serializeBinary()))
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
        });

        tcpSocket.on('data', (data) => {
            logger.debug("tcpsocket receive data: ", data)
            let gserverData = GServer.decodeData(data)
            logger.debug("Header:", gserverData.header)
            logger.debug("Message:", gserverData.message)
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