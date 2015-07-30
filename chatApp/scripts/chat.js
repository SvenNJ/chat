var chat = {
	key: 'USERCHAT',
	code: 0,
    init: function() {
		var chatSocket = io.connect();
		
		/*---------连接服务器 start---*/
        chatSocket.on('connect', function() {
			var userCookie = chat.getCookie(chat.key);
			if(userCookie){
				console.log("connect cookie name:" + userCookie);
				chatSocket.emit('login', userCookie);
			}else{
				$('#nickWrapper').show();
				$('#info').text('给自己取注册个名字吧');
				$('#nicknameInput').focus();
			}
        });
        chatSocket.on('error', function(code) {
			var tips = '';
			switch(code){
				case -1:
					tips = '登录失败!';
					break;
				case -2:
					tips = '该用户名已登录！';
					break;
				default:
					tips = '异常错误!';
			}
			chat.code = code;
			$('#loginWrapper').hide();
			$('#status').text(tips);
        });
		
		/*---------点击注册登录 start---*/
		chatSocket.on('nickExisted', function() {
			$('#info').text('该用户名已登录！');
        });
		$('#loginBtn').click(function(){
			var nickName = $('#nicknameInput').val();
            if (nickName.trim().length != 0) {
				chat.setCookie(chat.key, nickName, {'time':'day'});
				console.log("set cookie name:" + chat.getCookie(chat.key));
                chatSocket.emit('login', nickName);
            } else {
                $('#nicknameInput').focus();
            };
		});

        $('#nicknameInput').keyup(function(e){
			if (e.keyCode == 13) {
                var nickName = $('#nicknameInput').val();
                if (nickName.trim().length != 0) {
					chat.setCookie(chat.key, nickName, {'time':'day'});
					console.log("set cookie name:" + chat.getCookie(chat.key));
                    chatSocket.emit('login', nickName);
                };
            };
		});
		/*---------点击注册登录 end---*/
		
		/*---------登陆成功之后发送一条系统消息 start---*/
		chatSocket.on('loginSuccess', function() {
            $('#loginWrapper').hide();
            $('#messageInput').focus();
        });
        chatSocket.on('system', function(nickName, userCount, type) {
            var msg = nickName + (type == 'login' ? ' 加入聊天' : ' 退出');
            chat._displayNewMsg('管理员 ', msg, 'red');
			$('#status').text(userCount + '人在线');
        });
		
		
		/*---------注册 "发送一条消息" 事件 start---*/
        chatSocket.on('newMsg', function(user, msg, color) {
            chat._displayNewMsg(user, msg, color);
        });
        chatSocket.on('newImg', function(user, img, color) {
            chat._displayImage(user, img, color);
        });
		
		
		/*---------消息发送 start---*/
        $('#sendBtn').click(function() {//点击按钮发送消息
			if(chat.code < 0){
				return;
			}
            var messageInput = $('#messageInput'),
                msg = messageInput.val(),
                color = $('#colorStyle').val();
            messageInput.val('');
            messageInput.focus();
            if (msg.trim().length != 0) {
                chatSocket.emit('postMsg', msg, color);
                chat._displayNewMsg('me', msg, color);
                return;
            };
        });
        $('#messageInput').keyup(function(e) {//键盘回车发送消息
			if(chat.code < 0){
				return;
			}
            var messageInput = $('#messageInput'),
                msg = messageInput.val(),
                color = $('#colorStyle').val();
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.val('');
                chatSocket.emit('postMsg', msg, color);
                chat._displayNewMsg('me', msg, color);
            };
        });
		$('#sendImage').change(function() {//发送图片
			if(chat.code < 0){
				return;
			}
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader(),
                    color = $('#colorStyle').val();
                if (!reader) {
                    chat._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
                    this.val('');
                    return;
                };
                reader.onload = function(e) {
                    this.val('');
                    chatSocket.emit('img', e.target.result, color);
                    chat._displayImage('me', e.target.result, color);
                };
                reader.readAsDataURL(file);
            };
        });
        $('#emoji').click(function(e) {//点击"表情"按钮触发事件
			if(chat.code < 0){
				return;
			}
			//HiChat._initialEmoji();//初始化表情
            var emojiwrapper = $('#emojiWrapper');
            emojiwrapper.show();
            e.stopPropagation();
        });
        document.body.addEventListener('click', function(e) {//点击网页表情其他区域，表情区域隐藏
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            };
        });
        $('#emojiWrapper').click(function(e) {//点击表情区域，选择表情
			if(chat.code < 0){
				return;
			}
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = $('#messageInput');
                messageInput.focus();
                messageInput.val(messageInput.val() + '[emoji:' + target.title + ']');
            };
        });
		/*---------消息发送 end---*/
		
		
		/*---------清除消息---*/
        $('#clearBtn').click(function() {
			if(chat.code < 0){
				return;
			}
            $('#historyMsg').html('');
        });
    },
	setCookie: function(key, value, options){
		options = options && typeof options == 'object' ? options : {};
		if (value === null || typeof (value) == 'undefined') options.expires = -1;
		if (typeof options.expires === 'number') {
			var days = options.expires,
				t = options.expires = new Date();
			t.setDate(t.getDate() + days);
		}
		if (options.time == 'day') {
			t = options.expires = new Date();
			t.setDate(t.getDate() + 1);
			t.setHours(0);
			t.setMinutes(0);
			t.setSeconds(0);
		}
		value = String(value);
		return (document.cookie = [encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value), options.expires ? ';expires=' + options.expires.toUTCString() : '', options.path ? ';path=' + options.path : '', options.domain ? ';domain=' + options.domain : '', options.secure ? ';secure' : ''].join(''))
	},
	getCookie: function(key){
		var result, decode = decodeURIComponent;
		return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
	},
    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../content/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    _displayNewMsg: function(user, msg, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            //determine whether the msg contains emoji
            msg = this._showEmoji(msg);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _showEmoji: function(msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
            };
        };
        return result;
    }
};
