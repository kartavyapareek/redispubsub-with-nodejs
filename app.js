const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');

//set Port
const port = 3000;
// init app
const app = express();

var server = app.listen(port, function(){
	console.log('Server Started On Port'+port);
});

//redis setup
const rport = 6379;
const rhost = '127.0.0.1';

// redis sub pub clients
var redis = require("redis")
  , subscriber = redis.createClient(rport, rhost)
  , publisher = redis.createClient(rport, rhost);

// io socket with redis
const io = require('socket.io')(server);
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ publisherClient: publisher, subClient: subscriber }));

// listening redis message
io.sockets.on('connection', function (socket) {
     subscriber.on("message", function(channel, message) {
         socket.emit('message', message);                
     });
  });

//view Engine
app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

//body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// routes define
app.get('/', function(req, res, next){
	res.render('home')
});

app.get('/subscribe', function(req, res, next){
	res.render('subscribe')
});

app.post('/subscribe-channel', function(req, res, next){
	var channel = req.body.channel;
	subscriber.subscribe(channel);
	res.redirect('/')
});

app.get('/unsubscribe', function(req, res, next){
	res.render('unsubscribe')
});

app.post('/unsubscribe-channel', function(req, res, next){
	var channel = req.body.channel;
	subscriber.unsubscribe(channel);
	res.redirect('/')
});

app.get('/publish', function(req, res, next){
	res.render('publish')
});

app.post('/publish-msg', function(req, res, next){
	var channel = req.body.channel;
	var msg = req.body.message;
	publisher.publish(channel,msg);
	res.redirect('/')

});


app.post('/api/publish', function (req, res, next) {
	var channel = req.param('channel');
	var msg = req.param('message');
	publisher.publish(channel,msg);
	res.json("channel: "+channel+" message: "+ msg+ " sent")
});

app.post('/api/subscribe', function (req, res, next) {
	var channel = req.param('channel');
	subscriber.subscribe(channel);
	res.json("Channel: "+channel+" subscribed.")
});

app.post('/api/unsubscribe', function (req, res, next) {
	var channel = req.param('channel');
	subscriber.unsubscribe(channel);
	res.json("Channel: "+channel+" unsubscribed.")
});
