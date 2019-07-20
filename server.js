const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const multer = require('multer');
const upload = multer();
app.use(cookieParser());
const passwordsAssoc = {};
const sessions = {};
const ignoreLists = {};
const messages = [];
const directMessages = {};
app.use('/static', express.static(__dirname + '/public'));
app.get('/', (_, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

class Message {
  constructor(user, msg) {
    this.user = user;
    this.msg = msg;
    this.timestamp = Date.now();
  }
}

app.post('/messages', upload.none(), (req, res) => {
  console.log('POST messages body', req.body);
  const sessionId = req.cookies.sid;
  const newMessage = new Message(sessions[sessionId], req.body.message);
  messages.push(newMessage);
  res.send(JSON.stringify({ success: true, messages }));
});

app.post('/ignore', upload.none(), (req, res) => {
  const ignoreUsername = req.body.username;
  if (!passwordsAssoc[ignoreUsername]) {
    return res.send(
      JSON.stringify({ success: false, msg: 'User does not exist' })
    );
  }
  const sessionId = req.cookies.sid;
  const username = sessions[sessionId];
  ignoreLists[username].push(ignoreUsername);
  res.send(
    JSON.stringify({ success: true, ignoreList: ignoreLists[username] })
  );
});

app.get('/messages', (req, res) => {
  console.log('Sending back the messages');
  const sessionId = req.cookies.sid;
  const username = sessions[sessionId];
  const filteredMessages = messages.filter(
    (message) => !ignoreLists[username].includes(message.user)
  );
  res.send(JSON.stringify({ success: true, messages: filteredMessages }));
});

app.get('/direct-messages', (req, res) => {
  const sessionId = req.cookies.sid;
  const username = sessions[sessionId];
  const messages = directMessages[username];
  res.send(JSON.stringify({ success: true, messages }));
});

app.post('/direct-message', upload.none(), (req, res) => {
  const recipient = req.body.recipient;
  if (!passwordsAssoc[recipient]) {
    return res.send(
      JSON.stringify({ success: false, msg: 'User does not exist' })
    );
  }
  const sessionId = req.cookies.sid;
  const username = sessions[sessionId];
  const message = req.body.message;
  const messageObj = new Message(username, message);
  directMessages[recipient].push(messageObj);
  res.send(JSON.stringify({ success: true }));
});

app.post('/signup', upload.none(), (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (passwordsAssoc[username]) {
    return res.send(JSON.stringify({ success: false, msg: 'Username taken' }));
  }
  passwordsAssoc[username] = password;
  ignoreLists[username] = [];
  directMessages[username] = [];
  res.send(JSON.stringify({ success: true }));
});

app.post('/login', upload.none(), (req, res) => {
  const username = req.body.username;
  const passwordGiven = req.body.password;
  const expectedPassword = passwordsAssoc[username];
  if (expectedPassword !== passwordGiven) {
    return res.send(
      JSON.stringify({ success: false, msg: 'Invalid password' })
    );
  }
  const sid = Math.floor(Math.random() * 10000000);
  sessions[sid] = username;
  res.cookie('sid', sid);
  res.send(JSON.stringify({ success: true }));
});

app.listen(4000);
