'use strict';

const express = require('express');
const socketIO = require('socket.io');
const session = require('express-session');
const space = require(__dirname+'/lib/space');
const PORT = process.env.PORT || 3000;
const  app = express();

var clients=[];
var rooms=[];

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
        req.session.clientId = clients.length;
        clients[clients.length]='';
    }
    res.render('main', { clientId: req.session.clientId });
});
//app.use(express.static('public'))
const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));


const io = socketIO(server);
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('login', (data) => {
        console.log('Client login');
        console.log(data);
        if(clients[data.clientId] == '')
        {

            clients[data.clientId] = {socket: socket, room:rooms[rooms.length]};
            console.log(rooms);
            if( rooms.length==0 || rooms[rooms.length-1].client == undefined)
            {
                console.log('fir')
                clients[data.clientId].room = rooms.length;
                rooms[clients[data.clientId].room]={client:[]};
                rooms[clients[data.clientId].room].client[0] = {clientId:data.clientId};
                socket.emit('waitOponent',{})
            }
            else{
                console.log('sec')
                clients[data.clientId].room = rooms.length-1;

                let room = rooms[clients[data.clientId].room];

                room.client[1] = {clientId:data.clientId};

                let fir = clients[room.client[0].clientId];
                let sec = clients[room.client[1].clientId];

                room.client[0].space=space.create(10,10);
                room.client[1].space=space.create(10,10);
                fir.socket.emit('initSpace',{
                    own:room.client[0].space.get4My(),
                    opo:room.client[1].space.get4Other()
                });
                sec.socket.emit('initSpace',{
                    own:room.client[1].space.get4My(),
                    opo:room.client[0].space.get4Other()
                });
                room.move=parseInt(Math.random()*2)
                clients[room.client[room.move].clientId].socket.emit('MoveRight',{a:0});

            }
        }
        else {
            console.log(clients[data.clientId].room);

            clients[data.clientId].socket=socket;

            let room = rooms[clients[data.clientId].room];
            console.log(room.client);
            if(data.clientId == room.client[0].clientId)
            {

                clients[data.clientId].socket.emit('initSpace',{
                    own:room.client[0].space.get4My(),
                    opo:room.client[1].space.get4Other()
                });
                if(room.move==0){
                    clients[room.client[room.move].clientId].socket.emit('MoveRight',{a:1});
                }
            }
            else{
                clients[data.clientId].socket.emit('initSpace',{
                    own:room.client[1].space.get4My(),
                    opo:room.client[0].space.get4Other()
                });
                if(room.move==1){
                    clients[room.client[room.move].clientId].socket.emit('MoveRight',{a:2});
                }
            }
        }
    });

    socket.on('fire', (data) => {
        let room = rooms[clients[data.clientId].room];
        console.log(room.client,data);

        let op = 1 - room.move;
        let own = clients[room.client[room.move].clientId];
        let opo = clients[room.client[op].clientId];

        if(data.clientId == room.client[room.move].clientId) {
            console.log(data.clientId);
            if(room.client[op].space.get(data.x,data.y)=='#')
            {
                console.log('hit');
                room.client[op].space.set(data.x,data.y,'X');
                own.socket.emit('hitOp',{x:data.x,y:data.y});
                opo.socket.emit('hitMy',{x:data.x,y:data.y});
                own.socket.emit('MoveRight',{a:3});
            }
            else{
                console.log('past');
                room.client[op].space.set(data.x,data.y,'*');
                own.socket.emit('pastOp',{x:data.x,y:data.y});
                opo.socket.emit('pastMy',{x:data.x,y:data.y});
                opo.socket.emit('MoveRight',{a:4});
                room.move = op;
            }
        }
    });

    socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
