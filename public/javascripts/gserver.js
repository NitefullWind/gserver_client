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
        ROOMLIST: 104,
        ROOMINFO: 105,
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
        let msgPB = new proto.gserver.protobuf.MessagePB();
        msgPB.setReceiverId(receiverId);
        if(messageType == 1) {
            msgPB.setMessagetype(proto.gserver.protobuf.MessagePB.MessageType.MT_PRIVATE_CHAT);
        } else if(messageType == 2) {
            msgPB.setMessagetype(proto.gserver.protobuf.MessagePB.MessageType.MT_GROUP_CHAT);
        }
        msgPB.setDatatype(proto.gserver.protobuf.MessagePB.DataType.DT_TEXT);
        msgPB.setData(msg);
        let buf = msgPB.serializeBinary();
        this.send(GServer.Command.SENDMSG, buf);
    });
    
    // 发送消息响应
    this.registerRspHandle(GServer.Command.SENDMSG, (rspcode, message) => {
        if(rspcode == GServer.RspCode.SUCCESS) {
            console.log("[Client](", this.name, ") 消息发送成功");
        } else {
            console.log("[Client](", this.name, ") 消息发送失败：", UTF8Bytes2String(message));
            let msgPB = proto.gserver.protobuf.MessagePB.deserializeBinary(message);
            if (msgPB.getDatatype() == proto.gserver.protobuf.MessagePB.DataType.DT_TEXT) {
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
            let msgPB = proto.gserver.protobuf.MessagePB.deserializeBinary(message);
            if (msgPB.getDatatype() == proto.gserver.protobuf.MessagePB.DataType.DT_TEXT) {
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
            console.log("[Client](", this.name, ") 消息接收失败：", UTF8Bytes2String(message));
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
        let playerpb = new proto.gserver.protobuf.PlayerPB();
        playerpb.setName(name);
        playerpb.setPassword(password);
        let buf = playerpb.serializeBinary();
        this.send(GServer.Command.LOGIN, buf);
        if(this.client_chat) {
            this.client_chat.send(GServer.Command.LOGIN, buf);
        }
    });
    this.registerCommand("logout", () => {
        this.send(GServer.Command.LOGOUT, new Uint8Array());
        if(this.client_chat) {
            this.client_chat.send(GServer.Command.LOGOUT, buf);
        }
    });
    this.registerCommand("createroom", async (name, password, description) => {
        let roompb = new proto.gserver.protobuf.RoomPB();
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
        let roompb = new proto.gserver.protobuf.RoomPB();
        roompb.setId(roomId);
        roompb.setName(name);
        roompb.setDescription(description);
        roompb.setPassword(password);
        let buf = roompb.serializeBinary();
        this.send(GServer.Command.UPDATEROOM, buf);
    });
    this.registerCommand("joinroom", async (roomId) => {
        let roompb = new proto.gserver.protobuf.RoomPB();
        roompb.setId(roomId);
        let buf = roompb.serializeBinary();
        this.send(GServer.Command.JOINROOM, buf);
    });
    this.registerCommand("exitroom", async (roomId) => {
        let roompb = new proto.gserver.protobuf.RoomPB();
        roompb.setId(roomId);
        let buf = roompb.serializeBinary();
        this.send(GServer.Command.EXITROOM, buf);
    });
    this.registerCommand("getroomlist", async () => {
        this.send(GServer.Command.ROOMLIST, new Uint8Array());
    });
    this.registerCommand("getroominfo", async (roomId) => {
        let roompb = new proto.gserver.protobuf.RoomPB();
        roompb.setId(roomId);
        let buf = roompb.serializeBinary();
        this.send(GServer.Command.ROOMINFO, buf);
    });
    
    // 登陆响应函数
    this.registerRspHandle(GServer.Command.LOGIN, (rspcode, message) => {
        if(GServer.RspCode.SUCCESS == rspcode) {
            console.log("[Client](", this.name, ") 登陆成功");
            this.runCommand('getroomlist')
        } else {
            console.log("[Client](", this.name, ") 登陆失败：", UTF8Bytes2String(message));
        }
    });
    // 获取房间列表响应函数
    this.registerRspHandle(GServer.Command.ROOMLIST, (rspcode, message) => {
        if(GServer.RspCode.SUCCESS == rspcode) {
            console.log("[Client](", this.name, ") 获取房间列表成功");
            let roomPBList = proto.gserver.protobuf.RoomPBList.deserializeBinary(message).getRoompbList();
            if(roomPBList.length == 0) {
                showMsg("房间列表为空", "warning", "menuViewRoomMsgDiv")
            } else {		
                showGameRoomList(roomPBList)
            }
        } else {
            console.log("[Client](", this.name, ") 获取房间列表失败：", UTF8Bytes2String(message));
            showMsg("获取房间列表失败", "danger", "menuViewRoomMsgDiv")
        }
    });
    // 获取房间列表响应函数
    this.registerRspHandle(GServer.Command.ROOMINFO, (rspcode, message) => {
        if(GServer.RspCode.SUCCESS == rspcode) {
            console.log("[Client](", this.name, ") 获取房间信息成功");
            let roomPB = proto.gserver.protobuf.RoomPB.deserializeBinary(message);
            console.log(roomPB)
            showRoomInfo(roomPB)
        } else {
            console.log("[Client](", this.name, ") 获取房间信息失败：", UTF8Bytes2String(message));
            showMsg(`获取房间信息失败：${UTF8Bytes2String(message)}`, "danger", "menuViewRoomMsgDiv")
        }
    });
    // 加入房间响应函数
    this.registerRspHandle(GServer.Command.JOINROOM, (rspcode, message) => {
        console.log("[Client](", this.name, ") 加入房间成功");
        if(GServer.RspCode.SUCCESS == rspcode) {
            let roomPB = proto.gserver.protobuf.RoomPB.deserializeBinary(message);
            console.log(roomPB);
        } else {
            let errmsg = `加入房间失败：${UTF8Bytes2String(message)}`
            alert(errmsg)
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
            
            let handleFunc = this.rspHandle[cmd];
            if(typeof(handleFunc) === "function") {
                handleFunc(rspcode, data);
            } else {
                console.log("[Client](", this.name, ") 未知的命令: ", cmd);
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
            console.log("[Client](", this.name, ") 登陆失败：", UTF8Bytes2String(message));
        }
    });
    this.registerRspHandle(GServer.Command.LOGOUT, (rspcode, message) => {
        console.log("[Client](", this.name, ") 退出登陆成功")
    });
    this.registerRspHandle(GServer.Command.CREATEROOM, (rspcode, message) => {
        console.log("[Client](", this.name, ") 创建房间成功");
        if(GServer.RspCode.SUCCESS == rspcode) {
            let roomPB = proto.gserver.protobuf.RoomPB.deserializeBinary(message);
            console.log(roomPB);
            showMsg(`创建房间[${roomPB.getName()}]成功`, 'success', 'menuCreateRoomMsgDiv')
        } else {
            showMsg(`创建房间失败：${UTF8Bytes2String(message)}`, 'danger', 'menuCreateRoomMsgDiv')
        }
    });
    this.registerRspHandle(GServer.Command.UPDATEROOM, (rspcode, message) => {
        console.log("[Client](", this.name, ") 修改房间信息成功");
        let roomPB = proto.gserver.protobuf.RoomPB.deserializeBinary(message);
        console.log(roomPB);
    });
    this.registerRspHandle(GServer.Command.JOINROOM, (rspcode, message) => {
        console.log("[Client](", this.name, ") 加入房间成功");
        let roomPB = proto.gserver.protobuf.RoomPB.deserializeBinary(message);
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

    $('#refreshRoomList').click(() => {
        clientGame.runCommand('getroomlist')
    })

    $('#btnCreateRoom').click(() => {
        createGameRoom()
    })

    $('#roomList').on('click', 'a', (e) => {
        clientGame.runCommand('getroominfo', $(e.target).data('id'))
    })
    
    getUserInfo()
})

/**
 * 创建gameclient的房间
 */
async function createGameRoom() {
    let name = $('#roomName').val()
    if(name == "") {
        showMsg("房间名称不能为空", "danger", "menuCreateRoomMsgDiv")
    } else {
        let password = $('#roomPassword').val()
        let description = $('#roomDescription').val()
        clientGame.runCommand('createroom', name, password, description)
    }
}

/**
 * 在网页中展示房间列表
 * @param {object} roomPBList 房间列表
 */
async function showGameRoomList(roomPBList) {
    $('#roomList').html('')
    for(let roomPB of roomPBList) {
        $('#roomList').append(`<li role="presentation"><a href="#" data-id="${roomPB.getId()}">${roomPB.getName()}</a></li>`)
    }
}

/**
 * 获取当前登陆的用户信息
 */
async function getUserInfo() {
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
 * 在区块中展示一条消息
 * @param {string} msg 消息内容
 * @param {string} catalogy 消息分类 可选值：success, info, warning, danger 默认为danger
 * @param {string} div_id 所属div的id
 * @param {boolean} prepend 是否在最前方添加; true: 消息内容不替换div_id元素内的元素, false： 消息内容将替换div_id元素内的元素; 默认为false
 */
async function showMsg(msg, catalogy='danger', div_id='top_div', prepend=false) {
    let msg_html = `<div class="alert alert-${catalogy}" role="alert">${msg}</div>`
    if(prepend) {
        $(`#${div_id}`).prepend(msg_html)
    } else {
        $(`#${div_id}`).html(msg_html)
    }
}

/**
 * 展示房间信息
 * @param {RoomPB} roomPB 房间信息
 */
async function showRoomInfo(roomPB) {
    let roomInfoHtml = `<p>名称：${roomPB.getName()}</p><p>房主：${roomPB.getOwner().getName()}</p><p>描述：${roomPB.getDescription()}</p>`
    $('#roomDetailInfo').html(roomInfoHtml)
}

/**
 * utf8 byte to unicode string
 * @param {Uint8Array} utf8Bytes
 * @returns {string}
 */
function UTF8Bytes2String(utf8Bytes){
    var str = new TextDecoder('utf8').decode(utf8Bytes);
    return str
}