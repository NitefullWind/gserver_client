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

    /**
     * 将GServer的buffer转换为MessageHeader和Buffer
     * @param {*} data GServer的buffer
     * @returns header, buffer
     */
    decodeData: (data) => {
        return {
            header: new GServer.MessageHeader(
                data.readInt16BE(),
                data.readInt16BE(2),
                data.readInt32BE(4),
                data.readInt32BE(8),
                data.readInt16BE(12),
                data.readInt32BE(14)), 
            message: data.subarray(18)
        }
    },

    /**
     * 将command和databuf转换为GServer的buffer
     * @param {*} command GServer.Command
     * @param {*} dataBuf buffer
     * @returns GServer的buffer
     */
    encodeData: (command, dataBuf) => {
		let dataLen = dataBuf.length;
		var sendBuf = Buffer.allocUnsafe(18+dataLen);
		sendBuf.writeInt16BE(0x4753);
		sendBuf.writeInt16BE(command, 2);
		sendBuf.writeInt32BE(0, 4);
		sendBuf.writeInt32BE(dataLen, 8);
		sendBuf.writeInt16BE(GServer.RspCode.SUCCESS, 12);
		sendBuf.writeInt32BE(1, 14);
		sendBuf.fill(dataBuf, 18);
		return sendBuf
	}
}

module.exports = GServer