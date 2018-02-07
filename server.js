'use strict';

const express = require('express');
const socketIO = require('socket.io');
const session = require('express-session');
const crypto = require('crypto');
const space = require(__dirname+'/lib/space');
const PORT = process.env.PORT || 3000;
const  app = express();



app.set('view engine', 'ejs');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

app.get('/', function(req, res){
    console.log('req.session.clientId');
    console.log(req.session.clientId);
    if(req.session.clientId == undefined){
        req.session.clientId = crypto.randomBytes(16).toString('hex');;
    }
    console.log(req.session.clientId);
    res.render('main', { clientId: req.session.clientId });
});
app.get('/logout', function(req, res) {
    console.log('logout:'+req.session.clientId)
    if(clients[req.session.clientId]!=undefined)
    {
        console.log(clients[req.session.clientId]);
        let room=rooms[clients[req.session.clientId].room]

        if(room.clients[0].clientId==req.session.clientId)
            clients[room.clients[1].clientId].socket.emit('msg',{msg:'opponent left the game'})
        else
            clients[room.clients[0].clientId].socket.emit('msg',{msg:'opponent left the game'})

    }
    delete req.session.clientId;
    res.redirect('/');
});
//app.use(express.static('public'))
const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

var clients={};
var rooms=[];
var currentGame=[];
var sokets={}

const io = socketIO(server);
io.on('connection', (socket) => {
    console.log('Client connected');
    console.log(socket.id);

    socket.on('login', (data) => {
        console.log('Client login');
        console.log(data);
        sokets[socket.id] = data.clientId;

        if(clients[data.clientId] == undefined)
        {
            clients[data.clientId] = {socket: socket};
            console.log(currentGame);
            if(currentGame.length==0)
            {
                console.log('fir')
                console.log(data.clientId)
                currentGame.push(data.clientId);
                socket.emit('waitOponent',{})
            }
            else if(currentGame.length==1)
            {
                console.log('sec')
                console.log(data.clientId)

                currentGame.push(data.clientId);
                clients[currentGame[0]].room=rooms.length
                clients[currentGame[1]].room=rooms.length

                rooms.push({
                    clients:[
                        {clientId:currentGame[0]},
                        {clientId:currentGame[1]}
                    ],
                    move:parseInt(Math.random()*2)
                });
                currentGame=[];
                let room = rooms[rooms.length-1];

                let fir = clients[room.clients[0].clientId];
                let sec = clients[room.clients[1].clientId];

                room.clients[0].space=space.create(10,10);
                room.clients[1].space=space.create(10,10);

                fir.socket.emit('initSpace',{
                    own:room.clients[0].space.get4My(),
                    opo:room.clients[1].space.get4Other()
                });

                sec.socket.emit('initSpace',{
                    own:room.clients[1].space.get4My(),
                    opo:room.clients[0].space.get4Other()
                });

                clients[room.clients[room.move].clientId].socket.emit('MoveRight',{a:0});

            }
        } else if(clients[data.clientId].room !=undefined){

            console.log(data.clientId);
            clients[data.clientId].socket=socket;

            let room = rooms[clients[data.clientId].room];

            if(data.clientId == room.clients[0].clientId)
            {

                clients[data.clientId].socket.emit('initSpace',{
                    own:room.clients[0].space.get4My(),
                    opo:room.clients[1].space.get4Other()
                });
                if(room.move==0){
                    clients[room.clients[room.move].clientId].socket.emit('MoveRight',{a:1});
                }
            }
            else{
                clients[data.clientId].socket.emit('initSpace',{
                    own:room.clients[1].space.get4My(),
                    opo:room.clients[0].space.get4Other()
                });
                if(room.move==1){
                    clients[room.clients[room.move].clientId].socket.emit('MoveRight',{a:2});
                }
            }

        }
    });

    socket.on('fire', (data) => {
        let room = rooms[clients[data.clientId].room];

        console.log(data.clientId);

        let op = 1 - room.move;
        let own = clients[room.clients[room.move].clientId];
        let opo = clients[room.clients[op].clientId];

        if(data.clientId == room.clients[room.move].clientId) {

            if(room.clients[op].space.get(data.x,data.y)=='#')
            {
                console.log('hit');
                room.clients[op].space.set(data.x,data.y,'X');

                if(room.clients[op].space.countShip==0)
                {
                    own.socket.emit('end',{res:'You Win'});
                    opo.socket.emit('end',{res:'You Lose'});
                }else{

                    own.socket.emit('hitOp',{x:data.x,y:data.y});
                    opo.socket.emit('hitMy',{x:data.x,y:data.y});
                    own.socket.emit('MoveRight',{a:3});
                }


            }
            else{
                console.log('past');
                room.clients[op].space.set(data.x,data.y,'*');
                own.socket.emit('pastOp',{x:data.x,y:data.y});
                opo.socket.emit('pastMy',{x:data.x,y:data.y});
                opo.socket.emit('MoveRight',{a:4});
                room.move = op;
            }
        }

    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        if(currentGame[0]==sokets[socket.id])
            currentGame=[];
        console.log(socket.id);
    });
});
/*
setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
*/