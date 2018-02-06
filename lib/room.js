/**
 * Created by Alexandr on 05.02.2018.
 */



class Room {
    constructor(client) {
        this.first = client;
        this.second = false;
    }
    join(client){
        this.second = client;
    }
}


module.exports.Room =  Room;