var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [];
	
//specify the html we will use
app.use('/', express.static(__dirname + '/chatApp'));
server.listen(process.env.PORT || 3000);

//handle the socket
io.sockets.on('connection', function(socket) {
    //new user login
    socket.on('login', function(nickname) {
		console.log("User want login:" + nickname);
		if(nickname == '' || typeof(nickname) == 'undefined'){
			socket.emit('error', -1);//登录失败
			return;
		}
		
        if (users.indexOf(nickname) > -1) {
            io.sockets.emit('error',-2);
        } else {
            socket.userIndex = users.length;
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nickname, users.length, 'login');
			console.log("Login person:"+ JSON.stringify(users));
        };
    });

    //user leaves
    socket.on('disconnect', function() {
        users.splice(socket.userIndex, 1);
		console.log("left person:"+ JSON.stringify(users));
        socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
    });
    //new message get
    socket.on('postMsg', function(msg, color) {
        socket.broadcast.emit('newMsg', socket.nickname, msg, color);
    });
    //new image get
    socket.on('img', function(imgData, color) {
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
    });
});