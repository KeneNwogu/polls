const http = require('http');
const express = require('express');
const { Server } = require("socket.io");

const app = express();

// handles creation of posts
app.post('/polls', (req, res) => {

})


const server = http.createServer(app)

const io = new Server(server);

server.listen(3000);