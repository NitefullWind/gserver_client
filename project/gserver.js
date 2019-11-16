var GServer = {
    Command: 
    {
        INVILID: 0,
        LOGIN: 1,
        LOGOUT: 2,
        CREATEROOM: 100,
        UPDATEROOM: 101,
        JOINROOM: 102,
        EXITROOM: 103,
        ROOMLIST: 104,
        ROOMINFO: 105,
        SENDMSG: 200,
        RECVMSG: 201,
    },
    
    RspCode:
    {
        ERROR : 0,
        SUCCESS : 1,
    },

    MessageHeader: function(flag, cmd, reqid, datalen, rspcode, clientversion) {
        this.flag = flag;
        this.cmd = cmd;
        this.reqid = reqid;
        this.datalen = datalen;
        this.rspcode = rspcode;
        this.clientversion = clientversion;
    },

    MessageHeaderLength: 18,

    MessageHeaderFlag: 0x4753,

    MessageHeaderVersion: 1,

    /**
     * 弃用
     * 将GServer的buffer转换为MessageHeader和header中指定长度的Buffer
     * @param {*} data GServer的buffer
     * @returns header, buffer
     */
    // decodeData: (data) => {
    //     return {
    //         header: new GServer.MessageHeader(
    //             data.readInt16BE(),
    //             data.readInt16BE(2),
    //             data.readInt32BE(4),
    //             data.readInt32BE(8),
    //             data.readInt16BE(12),
    //             data.readInt32BE(14)), 
    //         message: data.subarray(18, 18+header.datalen)
    //     }
    // },
    
    /**
     * 解析GServer返回的数据
     * @param {Buffer} data GServer返回的Buffer数据
     * @returns {Object} 解析结果
     */
    parseMessageHeader: (data) => {
        let parseResult = {
            success: false,         // 解析是否成功
            errmsg: undefined,      // 解析错误消息
            data: data,             // 解析后的Buffer数据
            header: undefined,      // 解析出的header
            message: undefined      // 解析出的message
        }

        if(data.length < GServer.MessageHeaderLength) {                                 // 数据量少于一个消息头的长度
            parseResult.errmsg = 'Too few readable bytes'
        } else {
            var header = new GServer.MessageHeader(
                data.readInt16BE(),
                data.readInt16BE(2),
                data.readInt32BE(4),
                data.readInt32BE(8),
                data.readInt16BE(12),
                data.readInt32BE(14));
            if(header.flag != GServer.MessageHeaderFlag) {                              // 不合法的消息头，抛弃所有收到的数据
                parseResult.errmsg = 'Invalid request header flag'
                parseResult.data = Buffer.alloc(0)
            } else {
                let expectDataLength = GServer.MessageHeaderLength + header.datalen
                if(data.length < expectDataLength) {                                    // 收到的数据包尚不完全
                    parseResult.errmsg = `Readable bytes: ${data.length} less than header's datalen: ${expectDataLength}`
                } else {
                    parseResult.success = true
                    parseResult.header = header
                    parseResult.message = data.subarray(GServer.MessageHeaderLength, expectDataLength)
                    parseResult.data = data.subarray(expectDataLength)
                }
            }
        }
        return parseResult
    },

    /**
     * 将command和databuf转换为GServer的buffer
     * @param {*} command GServer.Command
     * @param {*} dataBuf buffer
     * @returns GServer的buffer
     */
    encodeData: (command, dataBuf) => {
		let datalen = dataBuf.length;
		var sendBuf = Buffer.allocUnsafe(18+datalen);
		sendBuf.writeInt16BE(0x4753);
		sendBuf.writeInt16BE(command, 2);
		sendBuf.writeInt32BE(0, 4);
		sendBuf.writeInt32BE(datalen, 8);
		sendBuf.writeInt16BE(GServer.RspCode.SUCCESS, 12);
		sendBuf.writeInt32BE(1, 14);
		sendBuf.fill(dataBuf, 18);
		return sendBuf
	}
}

module.exports = GServer