const http = require('http');
const mongoose = require('mongoose')
const express = require('express');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json()
const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');
const cors = require('cors');
const { celebrate, Segments, errors } = require('celebrate');
const { PollSerializer } = require('./serializers');
const Poll = require('./models/poll');
const { ManagementClient } = require('auth0')

const dotenv = require('dotenv')
dotenv.config()

mongoose.connect(process.env.DEBUG_MODE !== 'dev' ? process.env.MONGO_URI : 'mongodb://localhost:27017/polls')

const app = express();
app.use(cors());
app.use(jsonParser);

var jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: process.env.JWKS_URI
    }),
    audience: 'http://localhost:3000/',
    issuer: process.env.AUTH_ISSUER,
    algorithms: ['RS256'],   
})

const auth0Management = new ManagementClient({
    domain: process.env.AUTH_DOMAIN,
    clientId: process.env.MANAGER_CLIENT_ID,
    clientSecret: process.env.MANAGER_CLIENT_SECRET,
    scope: 'read:users update:users'
})

// get all authenticated user's polls
app.get('/polls', jwtCheck, async (req, res) => {
    console.log(req.auth)
    const polls = await Poll.find({ user_id: req.auth.sub })
    return res.json({ polls })
})

// handles creation of posts
app.post('/polls', celebrate({ [Segments.BODY]: PollSerializer }), jwtCheck, async (req, res) => {
    let { title, options, public } = req.body;
    let poll = await Poll.create({ title, options, public, user_id: req.auth.sub })

    return res.json({ success: true, poll })
})

// visiting users can get specific poll [to vote]
app.get('/polls/:poll_id', async (req, res) => {
    try {
        let poll = await Poll.findById(req.params.poll_id)
        const user = await auth0Management.getUser({ id: poll.user_id });
        const username = user.username || user.nickname
        return res.json({ success: true, poll, username })
    }
    catch(e){
        console.log(e.message)
        if(e.name == "CastError") return res.status(400).json({ success: false })
        else return res.status(500).json({ success: false })
    }
})


const server = http.createServer(app)

const io = new Server(server, {
    cors: {
      origin: "http://localhost:8080",
      credentials: true
    }
});

io.on('connection', (socket) => {
    // handle connected sockets
    console.log('connected')
    socket.on('vote', async (poll_data) => {
        let { poll_id, option_id } = poll_data

        Poll.updateOne({ _id: poll_id,  'options._id': option_id }, 
        { $inc: {'options.$.votes': 1}}, function (err, docs) {
            if (err){
                console.log(err)
            }
            else{
                console.log("Updated Docs : ", docs);
                socket.broadcast.emit('poll_voted', { poll_id, option_id })
            }
        })
    })
})


app.use(errors());
app.use((err, req, res, next) => {
    console.log(err.message)
    if (err.name === "UnauthorizedError") {
        res.status(401).json({ message: "Invalid token"});
    } else {
        res.status(500).json({ success: false})
    }
    // return res.json({ message: "unauthorized"})
})


server.listen(3000, () => {
    console.log('server started. listening on port 3000')
});