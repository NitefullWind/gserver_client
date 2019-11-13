/**
 * GServer 定义字段
 */
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
        RECVMSG: 201,
    },
    
    RspCode:
    {
        ERROR : 0,
        SUCCESS : 1,
    }
}

/**
 * Chat Client
 * @param {string} url 服务器url
 * @param {string} name 客户端名称 默认与url相同
 */
function ClientChat(url, name=url)
{
	ClientGServer.call(this, url, name);
    this.initSocket(url)

	this.registerCommand("sendmsg", async (messageType, receiverId, msg) => {
		let msgPB = new proto.gserver.MessagePB();
		msgPB.setReceiverId(receiverId);
		if(messageType == 1) {
			msgPB.setMessagetype(proto.gserver.MessagePB.MessageType.MT_PRIVATE_CHAT);
		} else if(messageType == 2) {
			msgPB.setMessagetype(proto.gserver.MessagePB.MessageType.MT_GROUP_CHAT);
		}
		msgPB.setDatatype(proto.gserver.MessagePB.DataType.DT_TEXT);
		msgPB.setData(msg);
		let buf = msgPB.serializeBinary();
		this.send(GServer.Command.SENDMSG, buf);
	});
	
	// 发送消息响应
	this.registerRspHandle(GServer.Command.SENDMSG, (rspcode, message) => {
		if(rspcode == GServer.RspCode.SUCCESS) {
			console.log("[Client](", this.name, ") 消息发送成功");
		} else {
			console.log("[Client](", this.name, ") 消息发送失败：", message);
			let msgPB = proto.gserver.MessagePB.deserializeBinary(message);
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

	// 收到消息响应
	this.registerRspHandle(GServer.Command.RECVMSG, (rspcode, message) => {
		if(rspcode == GServer.RspCode.SUCCESS) {
			let msgPB = proto.gserver.MessagePB.deserializeBinary(message);
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
		} else {
			console.log("[Client](", this.name, ") 消息接收失败：", message);
		}
	});
}
ClientChat.prototype = new ClientGServer();

/**
 * Game Client
 * @param {string} url 服务器url
 * @param {string} name 客户端名称 默认与url相同
 */
function ClientGame(url, name=url)
{
    ClientGServer.call(this, name);
    this.initSocket(url)

	this.client_chat = undefined;
	this.setClientChat = async (clientChat) => {
		this.client_chat = clientChat;
	}
	
	this.registerCommand("login", async (name, password) => {
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
	this.registerCommand("joinroom", async (roomId) => {
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
	
	// 登陆响应理函数
	this.registerRspHandle(GServer.Command.LOGIN, (rspcode, message) => {
		if(GServer.RspCode.SUCCESS == rspcode) {
			console.log("[Client](", this.name, ") 登陆成功");
			let roomPBList = proto.gserver.RoomPBList.deserializeBinary(message).getRoompbList();
			if(roomPBList.length == 0) {
				showMsg("房间列表为空", "info", 'menu_view_room')
			} else {		
				for(let roomPB of roomPBList) {
					console.log(roomPB.array);
				}
			}
		} else {
			console.log("[Client](", this.name, ") 登陆失败：", message);
		}
	});
}
ClientGame.prototype = new ClientGServer();

/**
 * 客户端基类
 * @param {string} name 客户端名称
 */
function ClientGServer(name) {
    this.name = name

    var socket

    this.initSocket = (url) => {
		socket = io(url)
		socket.binaryType = 'arraybuffer'

        socket.on('connect', () => {
            console.log(`socket connect id: ${socket.id}`)
        })
        
        socket.on('connect_error', () => {
            console.log(`socket connect_error`)
			showMsg('服务器连接时出错')
        })
    
        socket.on('connect_timeout', () => {
            console.log(`socket connect_timeout`)
			showMsg('服务器连接超时')
        })
    
        socket.on('error', () => {
            console.log(`socket error`)
			showMsg('服务器发生了错误')
        })
    
        socket.on('disconnect', (reason) => {
			console.log("socket disconnect: ", reason)
			showMsg('服务器断开了连接')
        })
    
        socket.on('reconnect', () => {
            console.log(`socket reconnect`)
		})

        socket.on('connect_tcp', () => {
            console.log('on connect_tcp')
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
	/**
	 * 调用注册过的命令
	 */
	this.runCommand = async (cmd, ...args) => {
		let func = this.command[cmd];
		if(typeof(func) === "function") {
			if(func.constructor.name === "AsyncFunction") { // 异步函数
				await func(...args);
			} else {
				func(...args);
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
		if(GServer.RspCode.SUCCESS == rspcode) {
			console.log("[Client](", this.name, ") 登陆成功");
		} else {
			console.log("[Client](", this.name, ") 登陆失败：", message);
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

let clientGame = new ClientGame("www.nitefullwind.cn:3001")
let clientChat = new ClientChat("www.nitefullwind.cn:3002")
clientGame.setClientChat(clientChat)

$(function() {
    $('#btn_send').click(() => {
		clientChat.runCommand('sendmsg', 2, '1', $('#input_message').val())
    })
    
    $('#btn_connect_server').click(() => {
	})
	
	getUserInfo()
})

function getUserInfo() {
	$.ajax({
		type: 'GET',
		url: 'users/userinfo',
		dataType: 'json',
		success: (data) => {
			console.log(typeof(data))
			if(data['retcode'] == 200) {
				clientGame.runCommand('login', data['username'])
			} else {
				console.log('get user info fail: ', data['message'])
			}
		}
	})
}

/**
 * 在页面顶部展示一条消息
 * @param {string} msg 消息内容
 * @param {string} catalogy 消息分类 可选值：success, info, warning, danger 默认为danger
 * @param {string} div_id 所属div的id
 */
function showMsg(msg, catalogy='danger', div_id='top_div') {
	$(`#${div_id}`).html(`<div class="alert alert-${catalogy}" role="alert">${msg}</div>`)
}