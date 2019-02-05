// Ball vs Blocks
// Liberapp 2019 - Tahiti Katagai

const BLOCK_SIZE_PER_WIDTH = 1/6;
const BALL_SIZE_PER_WIDTH = 1/10; 

class Main extends egret.DisplayObjectContainer {

    public constructor() {
        super();
        this.once(egret.Event.ADDED_TO_STAGE, this.addToStage, this);
    }
 
    private addToStage() {
        Game.init();
        GameObject.initial( this.stage );
        new Ball();
        this.addEventListener(egret.Event.ENTER_FRAME,GameObject.process,this);
    }
}

class Game{

    public static height: number;
    public static width: number;

    static init() {
        this.height = egret.MainContext.instance.stage.stageHeight;
        this.width = egret.MainContext.instance.stage.stageWidth;
    }

    static random(min:number, max:number):number {
        return min + Math.random() * (max - min);
    }

    static clamp(value:number, min:number, max:number):number {
        if( value < min ) value = min;
        if( value > max ) value = max;
        return value;
    }
}

abstract class GameObject {
    
    protected display: egret.DisplayObject;

    constructor() {
        GameObject.objects.push(this);
    }

    abstract update() : void;

    destroy() { this.deleteFlag = true; }

    // system
    private static objects: GameObject[];
    protected static displayContainer: egret.DisplayObjectContainer;

    static initial(displayObjectContainer: egret.DisplayObjectContainer){
        GameObject.objects = [];
        GameObject.displayContainer = displayObjectContainer;
    }
    static process(){
        GameObject.objects.forEach( obj => obj.update() );
        GameObject.objects = GameObject.objects.filter( obj =>{
            if( obj.deleteFlag ) obj.delete();
            return ( !obj.deleteFlag );
        } );
    }
    static dispose(){
        this.objects.forEach( obj => obj.delete() );
        GameObject.objects = [];
    }

    private deleteFlag;
    private delete(){
        if( this.display ){
            GameObject.displayContainer.removeChild(this.display);
            this.display = null;
        }
    }
}

class Ball extends GameObject{

    radius:number;
    shape:egret.Shape;
    touchOffsetX:number = 0;

    constructor() {
        super();

        this.radius = Game.width * BALL_SIZE_PER_WIDTH * 0.5;
        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(0x00ffe0);
        this.shape.graphics.drawCircle(0, 0, this.radius);
        this.shape.graphics.endFill();
        GameObject.displayContainer.addChild(this.shape);

        this.shape.x = Game.width*0.5;
        this.shape.y = Game.height*0.7;

        GameObject.displayContainer.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => this.touchBegin(e), this);
        GameObject.displayContainer.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, (e: egret.TouchEvent) => this.touchMove(e), this);
    }
    
    update() {

    }

    touchBegin(e:egret.TouchEvent){
        this.touchOffsetX = this.shape.x - e.localX;
        console.log( "touchBegin " + this.touchOffsetX );
    }
    touchMove(e:egret.TouchEvent){
        this.shape.x = e.localX + this.touchOffsetX;
        this.shape.x = Game.clamp( this.shape.x, this.radius, Game.width - this.radius );
        this.touchOffsetX = this.shape.x - e.localX;
        //console.log( "touchMove " + this.shape.x );
    }
}
