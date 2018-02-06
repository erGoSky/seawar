/**
 * Created by Alexandr on 05.02.2018.
 */



class Sea {
    constructor(OPTIONS) {
        this.width = OPTIONS.width;
        this.height = OPTIONS.height;
        this.ships = [];
        this.sea = new Space(this.width,this.height);

    }

    createShip(len) {
        let vert = 0;
        let pos;
        while(true) {
            if (len > 1)
                vert = parseInt(Math.random() * 2) % 2;
            pos = this.getRandomPosition(this.width - (vert ? len : 0), this.height - (!vert ? len : 0))
            if(this.occupancyCheck(pos.x, pos.y, len, vert))
                break;
        }
        this.insertShip(pos.x,pos.y,len,vert);
    }

    createShips(len,count) {
        for(let i = 0 ; i < count ; i++)
            this.createShip(len);
    }

    getRandomPosition(w,h){
        let xy = parseInt(Math.random() * w * h);
        return {x:(xy-(xy % w))/w, y:  (xy % w)};
    }

    occupancyCheck(x,y,len,vert){
        for (let i = 0; i < len; i++){
            if(!this.occupancyCheckCell(x+(vert==0?i:0),y+(vert==1?i:0)))
                return false;
        }
        return true;
    }
    occupancyCheckCell(x,y){
        //console.log('occupancyCheckCell:'+x+','+y);
        if(this.sea.get(x,y) == '#') return false;
        if(x>0 && this.sea.get(x-1,y)=='#') return false;
        if(y>0 && this.sea.get(x,y-1)=='#') return false;
        if(x<this.width-1 && this.sea.get(x+1,y)=='#') return false;
        if(y<this.height-1 && this.sea.get(x,y+1)=='#') return false;
        return true
    }

    insertShip(x,y,len,vert) {
        this.ships.push({x, y, len, vert});
        for (let i = 0; i < len; i++)
            this.sea.set(x+(vert==0?i:0),y+(vert==1?i:0),'#')
    }




    outSpace(){
        let space='';
        for(let h=0; h< this.height;h++) {
            for(let w=0; w< this.width;w++){
                space+=this.sea.get(h,w);
            }
            space+="\n";
        }
        console.log(space);
    }
    getSpace(){
        return this.sea
    }
}

class Space{
    constructor(w,h) {

        this.width = w;
        this.height = h;
        this.space=[];
        for(let w=0; w < this.width;w++){
            this.space[w]=[];
            for(let h=0; h< this.height;h++) {
                this.space[w][h]='_';
            }
        }

        return this;
    }
    set(x,y,v){
        this.space[x][y]=v;
    }
    get(x,y){
        return this.space[x][y];
    }
    get4My() {
        return {space:this.space,height:this.height,width:this.width}
    }

    get4Other () {
        let space=[];

        for(let w=0; w< this.space.length;w++){
            space[w]=[]
            for(let h=0; h< this.space[w].length;h++) {
                if(
                    this.space[w][h]=='X' ||
                    this.space[w][h]=='*'
                )
                    space[w][h]=this.space[w][h];
                else
                    space[w][h]='_';
            }
        }
        return {space:space,height:this.height,width:this.width};
    }
}

module.exports.create = (w, h) => {
    let sea = new Sea({width:w, height:h });

    sea.createShip(5);
    sea.createShips(4,2);
    sea.createShips(2,3);
    sea.createShips(1,4);

    sea.outSpace();
    return sea.getSpace();
}
