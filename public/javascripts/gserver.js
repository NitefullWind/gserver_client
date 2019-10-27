$(function() {
    let clientGame = new ClientGame("www.nitefullwind.cn:3001")
    let clientChat = new ClientChat("www.nitefullwind.cn:3002")

    clientGame.setClientChat(clientChat)
    clientGame.runCommand('login')

    $('#btn_send').click(() => {
        console.log($('#input_message').val())
    })
    
    $('#btn_connect_server').click(() => {
    })
})

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
        SENDMSG: 200,
    },
    
    RspCode:
    {
        ERROR : 0,
        SUCCESS : 1,
    }
}

function ClientChat(url, name=url)
{
	ClientGServer.call(this, url, name);
    this.initSocket(url)

	this.registerCommand("sendmsg", async () => {
		let messageType = 2;
		let roomId = 0;
		let msg = "test message";
		let msgPB = new proto.gserver.MessagePB.MessagePB();
		msgPB.setReceiverId(roomId);
		if(messageType == "1") {
			msgPB.setMessagetype(proto.gserver.MessagePB.MessageType.MT_PRIVATE_CHAT);
		} else if(messageType == "2") {
			msgPB.setMessagetype(proto.gserver.MessagePB.MessageType.MT_GROUP_CHAT);
		}
		msgPB.setDatatype(proto.gserver.MessagePB.DataType.DT_TEXT);
		msgPB.setData(msg);
		let buf = msgPB.serializeBinary();
		this.send(GServer.Command.SENDMSG, buf);
	});
	
	this.registerRspHandle(GServer.Command.SENDMSG, (header, message) => {
		if(header.datalen == 0) {
			console.log("[Client](", this.name, ") 消息发送成功");
		} else {
			let msgPB = MessagePB.MessagePB.deserializeBinary(message);
			if (msgPB.getDatatype() == proto.gserver.MessagePB.DataType.DT_TEXT) {
				let sender = "Unkonw";
				if(msgPB.hasSender()) {
					sender = msgPB.getSender().getName();
				}
				console.log("Receive message from ", sender, ":")
				console.log(msgPB.getData());
			} else {
				console.log("Receive message: ")
				console.log(msgPB);
			}
		}
	});
}
ClientChat.prototype = new ClientGServer();

function ClientGame(url, name=url)
{
    ClientGServer.call(this, name);
    this.initSocket(url)

	this.client_chat = undefined;
	this.setClientChat = async (clientChat) => {
		this.client_chat = clientChat;
	}
	
	this.registerCommand("login", async () => {
		let name = "test user name";
		let password = "";
		let playerpb = new proto.gserver.PlayerPB();
		playerpb.setName(name);
		playerpb.setPassword(password);
		let buf = playerpb.serializeBinary();
		this.send(GServer.Command.LOGIN, buf);
		if(this.client_chat) {
			this.client_chat.send(GServer.Command.LOGIN, buf);
		}
	});
	this.registerCommand("logout", () => {
		var buf = Buffer.allocUnsafe(0);
		this.send(GServer.Command.LOGOUT, buf);
		if(this.client_chat) {
			this.client_chat.send(GServer.Command.LOGOUT, buf);
		}
	});
	this.registerCommand("createroom", async () => {
		let name = "test room name";
		let description = "";
		let password = "";
		let roompb = new proto.gserver.RoomPB();
		roompb.setName(name);
		roompb.setDescription(description);
		roompb.setPassword(password);
		let buf = roompb.serializeBinary();
		this.send(GServer.Command.CREATEROOM, buf);
	});
	this.registerCommand("updateroom", async () => {
		let name = "test room name";
		let description = "";
		let password = "";
		let roompb = new RoomPB.RoomPB();
		roompb.setId(roomId);
		roompb.setName(name);
		roompb.setDescription(description);
		roompb.setPassword(password);
		let buf = roompb.serializeBinary();
		this.send(GServer.Command.UPDATEROOM, buf);
	});
	this.registerCommand("joinroom", async () => {
		let roomId = 0;
		let roompb = new RoomPB.RoomPB();
		roompb.setId(roomId);
		let buf = roompb.serializeBinary();
		this.send(GServer.Command.JOINROOM, buf);
	});
	this.registerCommand("exitroom", async () => {
		let roomId = 0;
		let roompb = new RoomPB.RoomPB();
		roompb.setId(roomId);
		let buf = roompb.serializeBinary();
		this.send(GServer.Command.EXITROOM, buf);
	});
}
ClientGame.prototype = new ClientGServer();

function ClientGServer(name) {
    this.name = name

    var socket

    this.initSocket = (url) => {
        socket = io(url)

        socket.on('connect', () => {
            console.log(`socket connect id: ${socket.id}`)
        })
        
        socket.on('connect_error', () => {
            console.log(`socket connect_error`)
        })
    
        socket.on('connect_timeout', () => {
            console.log(`socket connect_timeout`)
        })
    
        socket.on('error', () => {
            console.log(`socket error`)
        })
    
        socket.on('disconnect', () => {
            console.log("socket disconnect")
        })
    
        socket.on('reconnect', () => {
            console.log(`socket reconnect`)
        })
    
        socket.on('connect_tcp', () => {
            console.log('on connect_tcp')
            
            let player = new proto.gserver.PlayerPB()
            player.setName(socket.id)
        })
    
        socket.on('gserver_data', (rspcode, cmd, data) => {
            console.log('gserver_data, cmd: ', cmd, data)
            
            if(rspcode == GServer.RspCode.ERROR) {
                console.log("[Server] ", data.toString());
            } else if (GServer.RspCode.SUCCESS) {
                let handleFunc = this.rspHandle[cmd];
                if(typeof(handleFunc) === "function") {
                    handleFunc(rspcode, data);
                } else {
                    console.log("[Client](", this.name, ") 未知的命令: ", cmd);
                }
            }
        })
    }

    this.send = async (cmd, buf) => {
        socket.emit('gserver_data', cmd, buf)
    }

	// 操作命令
	this.registerCommand = async (cmd, func) => {
		this.command[cmd] = func;
	}
	this.hasCommand = (cmd) => {
		if(typeof(this.command[cmd]) === "function") {
			return true;
		}
		return false;
	}
	this.runCommand = async (cmd) => {
		let func = this.command[cmd];
		if(typeof(func) === "function") {
			if(func.constructor.name === "AsyncFunction") { // 异步函数
				await func();
			} else {
				func();
			}
		} else {
			console.log("未注册的命令: ", cmd);
		}
	}
	this.command = {
    },

	// 应答处理函数
	this.rspHandle = {};
	this.registerRspHandle = async (cmd, func) => {
		this.rspHandle[cmd] = func;
	}
	this.registerRspHandle(GServer.Command.LOGIN, (rspcode, message) => {
		console.log("[Client](", this.name, ") 登陆成功");;
        let roomPBList = proto.gserver.RoomPBList.deserializeBinary(message).getRoompbList();
		for(let roomPB of roomPBList) {
			console.log(roomPB.array);
		}
	});
	this.registerRspHandle(GServer.Command.LOGOUT, (rspcode, message) => {
		console.log("[Client](", this.name, ") 退出登陆成功")
	});
	this.registerRspHandle(GServer.Command.CREATEROOM, (rspcode, message) => {
		console.log("[Client](", this.name, ") 创建房间成功");
		let roomPB = proto.gserver.RoomPB.deserializeBinary(message);
		console.log(roomPB);
	});
	this.registerRspHandle(GServer.Command.UPDATEROOM, (rspcode, message) => {
		console.log("[Client](", this.name, ") 修改房间信息登陆成功");
		let roomPB = proto.gserver.RoomPB.deserializeBinary(message);
		console.log(roomPB);
	});
	this.registerRspHandle(GServer.Command.JOINROOM, (rspcode, message) => {
		console.log("[Client](", this.name, ") 加入房间成功");
		let roomPB = proto.gserver.RoomPB.deserializeBinary(message);
		console.log(roomPB);
	});
	this.registerRspHandle(GServer.Command.EXITROOM, (rspcode, message) => {
		console.log("[Client](", this.name, ") 退出房间成功");
	});
}