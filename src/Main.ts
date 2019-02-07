// Ball vs Blocks
// Liberapp 2019 - Tahiti Katagai

const BLOCKS_IN_WIDTH = 4;
const BLOCK_SIZE_PER_WIDTH = 1/BLOCKS_IN_WIDTH;
const BALL_SIZE_PER_WIDTH = BLOCK_SIZE_PER_WIDTH / 2;

class Main extends egret.DisplayObjectContainer {

    public constructor() {
        super();
        this.once(egret.Event.ADDED_TO_STAGE, this.addToStage, this);
    }
 
    private addToStage() {
        GameObject.initial( this.stage );
        Game.init();
        // this.addEventListener(egret.Event.ENTER_FRAME,GameObject.process,this);
        egret.startTick(this.tickLoop, this);
    }

    tickLoop(timeStamp:number):boolean{
        GameObject.process();
        return false;
    }
}

class Game{

    public static height: number;
    public static width: number;

    static init() {
        this.height = egret.MainContext.instance.stage.stageHeight;
        this.width  = egret.MainContext.instance.stage.stageWidth;
        
        new Background();
        new Ball();
        new BlockWave();
        new ScorePoint();
    }

    static random(min:number, max:number):number {
        return min + Math.random() * (max - min);
    }

    static randomInt(min:number, max:number):number {
        return Math.floor( min + Math.random() * (max+0.999 - min) );
    }

    static clamp(value:number, min:number, max:number):number {
        if( value < min ) value = min;
        if( value > max ) value = max;
        return value;
    }

    static color( r:number, g:number, b:number):number {
        return ( Math.floor(r * 0xff)*0x010000 + Math.floor(g * 0xff)*0x0100 + Math.floor(b * 0xff) );
    }
}

abstract class GameObject {
    
    public shape:egret.Shape = null;

    constructor() {
        GameObject.objects.push(this);
    }

    abstract update() : void;

    destroy() { this.deleteFlag = true; }
    onDestroy(){}   // virtual method

    // system
    private static objects: GameObject[];
    protected static display: egret.DisplayObjectContainer;
    public static transit:()=>void;

    static initial(displayObjectContainer: egret.DisplayObjectContainer){
        GameObject.objects = [];
        GameObject.display = displayObjectContainer;
    }
    static process(){
        GameObject.objects.forEach( obj => obj.update() );
        GameObject.objects = GameObject.objects.filter( obj =>{
            if( obj.deleteFlag ) obj.delete();
            return ( !obj.deleteFlag );
        } );
        if( GameObject.transit ) {
            GameObject.dispose();
            GameObject.display.removeChildren();
            GameObject.transit();
            GameObject.transit = null;
        }
    }
    static dispose(){
        GameObject.objects.forEach( obj => { obj.destroy(); obj.delete(); } );
        GameObject.objects = GameObject.objects.filter( obj =>{ return false } );
        GameObject.objects = [];
    }

    protected deleteFlag;
    private delete(){
        if( this.shape ){
            GameObject.display.removeChild(this.shape);
            this.shape = null;
        }
        this.onDestroy();
    }
}

class Ball extends GameObject{

    static I:Ball = null;   // singleton instance

    readonly defaultHp:number = 5;
    readonly maxHp:number = 15;
    hp:number;
    radiusPerHp:number;
    radius:number;
    maxSpeed:number;
    speed:number;
    touchOffsetX:number = 0;
    stopFlag:boolean = false;
    invincible:number = 0;

    constructor() {
        super();

        Ball.I = this;
        console.log( "Ball " + this.toString());

        this.hp = this.defaultHp;
        this.radiusPerHp = Game.width * BALL_SIZE_PER_WIDTH * 0.5 / this.defaultHp;
        this.radius = this.radiusPerHp * this.hp;
        this.speed = this.maxSpeed = Game.height / (3 * 60);

        this.setShape(Game.width *0.5, Game.height *0.7, this.radius);

        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => this.touchBegin(e), this);
        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, (e: egret.TouchEvent) => this.touchMove(e), this);
    }

    onDestroy(){
        console.log( "Ball onDestroy()" + this.toString());
        GameObject.display.stage.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => this.touchBegin(e), this);
        GameObject.display.stage.removeEventListener(egret.TouchEvent.TOUCH_MOVE, (e: egret.TouchEvent) => this.touchMove(e), this);
        Ball.I = null;
    }

    setShape(x:number, y:number, radius:number){
        if( this.shape )
            GameObject.display.removeChild(this.shape);
        
        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(0xffc000);
        this.shape.graphics.drawCircle(0, 0, radius);
        this.shape.graphics.endFill();
        GameObject.display.addChild(this.shape);
        this.shape.x = x;
        this.shape.y = y;
    }
    
    update() {
        if( this.stopFlag ){
            this.stopFlag = false;
            this.speed = 0;
        }

        if( this.hp <= 0 )
            return;

        this.speed += Game.clamp( this.maxSpeed - this.speed, 0, this.maxSpeed*0.1 );
        this.shape.y += Game.clamp( Game.height*0.7-this.shape.y, -1, 1 );

        if( this.invincible > 0 ){
            this.invincible -= 1;
            this.shape.alpha = (this.invincible & 0x4) === 0 ? 1 : 0.5;
        }
    }

    touchBegin(e:egret.TouchEvent){
        if( this.hp <= 0 )
            return;
        this.touchOffsetX = this.shape.x - e.localX;
    }
    touchMove(e:egret.TouchEvent){
        if( this.hp <= 0 )
            return;
        this.shape.x = e.localX + this.touchOffsetX;
        this.shape.x = Game.clamp( this.shape.x, this.radius, Game.width - this.radius );
        this.touchOffsetX = this.shape.x - e.localX;
    }
    conflict(dx:number, dy:number){
        this.shape.x += dx;
        this.shape.y += dy;
        this.touchOffsetX += dx;
        if( dy > 0 ){
            this.stopFlag = true;
        }
        if( this.invincible <= 0 ){
            this.invincible = 60;
            
            this.hp = this.hp - 1;
            if( this.hp <= 0 ){
                new GameOver();
                this.stopFlag = true;
                return;
            }
            this.radius = this.radiusPerHp * this.hp;
            this.setShape(this.shape.x, this.shape.y, this.radius);
        }
    }
}

class Block extends GameObject{

    static readonly maxHp:number = 64;

    size:number;
    hp:number;

    constructor( x:number, y:number, hp:number ) {
        super();

        this.size = Game.width * BLOCK_SIZE_PER_WIDTH * 0.9;
        this.hp = hp;

        this.setShape(x, y);
    }
    setShape( x:number, y:number ){
        if( this.shape )
            GameObject.display.removeChild(this.shape);
        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(Block.getColor(this.hp));
        this.shape.graphics.drawRect(-0.5*this.size, -0.5*this.size, this.size, this.size);
        this.shape.graphics.endFill();
        GameObject.display.addChild(this.shape);
        GameObject.display.setChildIndex(this.shape, 2);
        this.shape.x = x;
        this.shape.y = y;
    }
    
    update() {
        this.shape.y += Ball.I.speed;

        // collision
        let dx = Ball.I.shape.x - this.shape.x;
        let dy = Ball.I.shape.y - this.shape.y;
        let r = Ball.I.radius + this.size*0.5;
        let dx2 = dx*dx;
        let dy2 = dy*dy;
        let rr = r*r;

        if( dx2 < rr && dy2 < rr){
            if( dx2 < dy2 && dy > 0 ){
                Ball.I.conflict( 0, r - dy + Ball.I.maxSpeed*0.2 );
                this.hp -= 1;
                this.setShape(this.shape.x, this.shape.y);
                if( this.hp <= 0 )
                    this.destroy();
            }
            else{
                Ball.I.conflict( (dx>0 ? r : -r ) - dx, 0 );
            }
        }
        
        if( this.shape.y >= Game.height )
            this.destroy();
    }

    static getColor( hp:number ): number{
        let rate = Game.clamp((hp-1) / (Block.maxHp-1), 0, 1);
        return Game.color( rate, 1-rate, 1-rate*0.25);
    }
}

class BlockWave extends GameObject{

    progress:number = 0;

    constructor() {
        super();
    }
    
    update() {
        const blockSize = Game.width * BLOCK_SIZE_PER_WIDTH;
        const blockHalf = blockSize * 0.5;

        this.progress += Ball.I.speed;
        if( this.progress >= blockSize*2 ) {
            this.progress -= blockSize*2;
            
            if( Game.randomInt(0,1) === 0 ){
                for( let i=0 ; i<6 ; i++ ){
                    if( Game.randomInt(0,3) > 0 ){
                        new Block( blockHalf + blockSize * i, 0, Game.randomInt(1,Block.maxHp) );
                    }
                }
            }
            else{
                let i = Game.randomInt(0,BLOCKS_IN_WIDTH);
                new Block( blockHalf + blockSize * i, 0, Game.randomInt(1,Block.maxHp) );
            }
        }
    }
}

class Background extends GameObject{

    constructor() {
        super();

        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(0x000000);
        this.shape.graphics.drawRect(0, 0, Game.width, Game.height);
        this.shape.graphics.endFill();
        GameObject.display.addChild(this.shape);
    }
    
    update() {}
}

class ScorePoint extends GameObject{

    static text:egret.TextField = null;

    score:number;

    constructor() {
        super();

        this.score = 0;

        const text = new egret.TextField();
        GameObject.display.addChild( text );
        text.text = "SCORE:" + this.score.toFixed();
        text.textColor = 0xffffff;
        text.x = (Game.width-text.width) / 2;
        text.y = 0;//(Game.height - text.height) / 2;
        ScorePoint.text = text;
    }
    
    onDestroy() {
        GameObject.display.removeChild( ScorePoint.text );
        ScorePoint.text = null;
    }

    update() {
        this.score += Ball.I.speed * 0.1;
        ScorePoint.text.text = "SCORE:" + this.score.toFixed();
    }
}

class GameOver extends GameObject{

    static text:egret.TextField = null;

    constructor() {
        super();

        const text = new egret.TextField();
        GameObject.display.addChild( text );
        text.text = "GAME OVER";
        text.bold = true;
        text.size = Game.width / 12;
        text.textColor = 0xe000ff;
        text.x = (Game.width - text.width) / 2;
        text.y = (Game.height - text.height) / 2;
        GameOver.text = text;
        
        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => this.tap(e), this);
    }

    onDestroy() {
        GameObject.display.removeChild( GameOver.text );
        GameObject.display.stage.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => this.tap(e), this);
        GameOver.text = null;
    }
    
    update() { }

    tap(e:egret.TouchEvent){
        if( this.deleteFlag )
            return;
        
        GameObject.transit = Game.init;

        this.destroy();
    }
}
