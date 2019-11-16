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
        var _tcpRecvBuffer = Buffer.alloc(0)

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

        /**
         * websocket收到数据，编码后发给tcp服务器
         */
        socket.on('gserver_data', (cmd, data) => {
            logger.debug("websocket receive data:", data)
            let dataArray = new Uint8Array(Object.values(data));
            tcpSocket.write(GServer.encodeData(cmd, Buffer.from(dataArray)))
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

        /**
         * TCP服务器收到数据，解析后转发给websocket
         */
        tcpSocket.on('data', (data) => {
            logger.debug("tcpsocket receive data: ", typeof(data), data)
            // 将新数据拼接到之前未处理数据中
            data = Buffer.concat([_tcpRecvBuffer, data], _tcpRecvBuffer.length + data.length)                         //!WARNING _tcpRecvBuffer是否线程安全
            do {
                // let gserverData = GServer.decodeData(data)
                // let header = gserverData.header
                // let message = gserverData.message
                let parseResult = GServer.parseMessageHeader(data)
                data = parseResult.data
                if(parseResult.success) {
                    let header = parseResult.header
                    let message = parseResult.message
                    logger.debug("Header:", header)
                    logger.debug("Message:", message)
                    socket.emit('gserver_data', header.rspcode, header.cmd, message)
                } else {
                    logger.error('GServer.parseMessageHeader error: ', parseResult.message)
                }
            } while (data.length >= GServer.MessageHeaderLength);
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