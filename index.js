const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(session({
    secret: 'my_super_secret_key_12345',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.json());


app.use(express.static(__dirname + '/public'));

app.get('/login/:userId', (req, res) => {
    req.session.userId = req.params.userId;
    res.send(`Logged in as user ${req.session.userId}`);
});

let users = {};

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('register', (userId) => {
        users[userId] = socket.id;
        console.log('Registered user:', userId);
    });

    socket.on('disconnect', () => {
        for (let userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                break;
            }
        }
        console.log('user disconnected');
    });
});

// setInterval(() => {
//     const message = 'Automatic notification at ' + new Date().toLocaleTimeString();
//     for (let userId in users) {
//         let msg = `Hey, ${userId}, you got notification!`
//         io.to(users[userId]).emit('notification', msg);
//     }
// }, 10000);

app.post('/notify/:userId', (req, res) => {
    const userId = req.params.userId;
    const message = req.body.message;
    const name = req.body.name;
    const msg = `Hey ${name}, ${message}`
    console.log(req.body)

    const userSocketId = users[userId];
    if (userSocketId) {
      io.to(userSocketId).emit('notification', msg);
      res.send(`Notification sent to user ${userId}`);
    } else {
      res.status(404).send('User not connected');
    }
  });

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
