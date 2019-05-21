var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

function updateUsers (key, value) {
    return new Promise((resolve, reject) => {
        let filepath = path.join(__dirname, '..', '/users.json');
        fs.readFile(filepath, 'utf8', (err, data) => {
            if (err) return reject(err);
            let user = null;
            data = JSON.parse(data);
            if (value) {
                data[key] = value;
                user = value;
            } else {
                user = data[key];
                console.log('删除：' + user);
                delete data[key];
            }
            fs.writeFile(filepath, JSON.stringify(data, null, 4), (err) => {
                if (err) return reject(err);
            });
            resolve(user);
        });
    })
}

io.on('connection', function(socket) {
    var ip = socket.request.connection.remoteAddress;
    updateUsers(ip, socket.handshake.query.nickname);
    console.log('user conneted');
    socket.on('disconnect', function() {
        updateUsers(socket.request.connection.remoteAddress).then((user) => {
            io.emit('system message', `${user} 离开了 聊天室`);
        });
        console.log('user disconneted');
    });
    socket.on("chat message", function(msg) {
        io.emit('chat message', msg);
    });
    socket.on('enter room', function(nickname) {
        updateUsers(socket.request.connection.remoteAddress, nickname);
        io.emit('system message', `${nickname} 进入了 聊天室`);
    });
    socket.on("image", function(msg) {
        io.emit('chat message', msg);
    });
})

http.listen(9000, function() {
    console.log('listening on 9000');
})