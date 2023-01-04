const http = require('http');
const mongoose = require('mongoose')
const express = require('express');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json()
const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');
const { celebrate, Segments, errors } = require('celebrate');
const { PollSerializer } = require('./serializers');
const Poll = require('./models/poll');

const dotenv = require('dotenv')
dotenv.config()

mongoose.connect(process.env.DEBUG_MODE !== 'dev' ? process.env.MONGO_URI : 'mongodb://localhost:27017/polls')

const app = express();
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

// get all authenticated user's polls
app.get('/polls', jwtCheck, async (req, res) => {
    const polls = await Poll.find({ user_id: req.auth.sub })
    return res.json({ polls })
})

// handles creation of posts
app.post('/polls', celebrate({ [Segments.BODY]: PollSerializer }), jwtCheck, async (req, res) => {
    let { title, options } = req.body;
    let poll = await Poll.create({ title, options, user_id: req.auth.sub })

    return res.json({ success: true, poll })
})

// visiting users can get specific poll [to vote]
app.get('/polls/:poll_id', async (req, res) => {
    let poll = await Poll.findById(req.params.poll_id)
    return res.json({ success: true, poll })
})


const server = http.createServer(app)

const io = new Server(server);

io.on('connection', (socket) => {
    // handle connected sockets
    
    socket.on('vote', async (poll_data) => {
        let data = JSON.parse(poll_data)
        let poll_id = data.poll_id;
        let option_vote_index = data.option_voted;
        let update_query = { $inc: { } }
        update_query.$inc[`options.${option_vote_index}.votes`] = 1
        Poll.updateOne({ poll_id }, update_query, function (err, doc){
            if(err) console.log(err)
            else{
                console.log(doc);
            }
        })
    })
})


app.use(errors());
app.use((err, req, res, next) => {
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