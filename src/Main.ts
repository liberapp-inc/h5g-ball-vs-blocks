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
        Util.init();
        Game.init();
        // this.addEventListener(egret.Event.ENTER_FRAME,GameObject.process,this);
        egret.startTick(this.tickLoop, this);
    }

    tickLoop(timeStamp:number):boolean{
        GameObject.process();
        return false;
    }
}

class Util{

    public static height: number;
    public static width: number;

    static init() {
        this.height = egret.MainContext.instance.stage.stageHeight;
        this.width  = egret.MainContext.instance.stage.stageWidth;
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

    static newTextField(text:string, size:number, color:number, xRatio:number, yRatio:number, bold:boolean): egret.TextField {
        let tf = new egret.TextField();
        tf.text = text;
        tf.bold = bold;
        tf.size = size;
        tf.textColor = color;
        tf.x = (Util.width  - tf.width)  * xRatio;
        tf.y = (Util.height - tf.height) * yRatio;
        return tf;
    }
}

class Game{

    static init() {
        new Background();
        new Ball();
        new BlockWave();
        new Score();
        new StartMessage();
    }
}

abstract class GameObject {
    
    public shape:egret.Shape = null;

    constructor() {
        GameObject.objects.push(this);
    }

    abstract update() : void;

    destroy() { this.deleteFlag = true; }
    onDestroy(){}

    // system
    private static objects: GameObject[];
    public static display: egret.DisplayObjectContainer;
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
            GameObject.transit();
            GameObject.transit = null;
        }
    }
    static dispose(){
        GameObject.objects = GameObject.objects.filter( obj => { obj.destroy(); obj.delete(); return false } );
    }

    protected deleteFlag;
    private delete(){
        this.onDestroy();
        if( this.shape ){
            GameObject.display.removeChild(this.shape);
            this.shape = null;
        }
    }
}

class Ball extends GameObject{

    static I:Ball = null;   // singleton instance

    readonly defaultHp:number = 8;
    hp:number;
    radiusPerHp:number;
    radius:number;
    maxSpeed:number;
    speed:number;
    touchOffsetX:number = 0;
    stopFlag:boolean = true;
    invincible:number = 0;
    started:boolean = false;

    constructor() {
        super();

        Ball.I = this;
        this.hp = this.defaultHp;
        this.radiusPerHp = Util.width * BALL_SIZE_PER_WIDTH * 0.5 / this.defaultHp;
        this.radius = this.radiusPerHp * this.hp;
        this.maxSpeed = Util.height / (3 * 60);
        this.speed = 0;
        this.setShape(Util.width *0.5, Util.height *0.7, this.radius);
        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => this.touchBegin(e), this);
        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, (e: egret.TouchEvent) => this.touchMove(e), this);
    }

    onDestroy(){
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
        if( this.hp <= 0 || this.started == false )
            return;

        if( this.stopFlag ){
            this.stopFlag = false;
            this.speed = 0;
        }

        this.speed += Util.clamp( this.maxSpeed - this.speed, 0, this.maxSpeed*0.1 );
        this.shape.y += Util.clamp( Util.height*0.7-this.shape.y, -1, 1 );

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
        this.shape.x = Util.clamp( this.shape.x, this.radius, Util.width - this.radius );
        this.touchOffsetX = this.shape.x - e.localX;
    }

    conflict(dx:number, dy:number): boolean{
        this.shape.x += dx;
        this.shape.x = Util.clamp( this.shape.x, this.radius, Util.width - this.radius );
        this.shape.y += dy;
        this.touchOffsetX += dx;
        if( dy > 0 ){
            this.stopFlag = true;
        }
        if( this.invincible <= 0 ){
            this.invincible = 15;
            this.hp = this.hp - 1;
            if( this.hp <= 0 ){
                new GameOver();
                this.stopFlag = true;
                this.speed = 0;
                return true;
            }
            this.radius = this.radiusPerHp * this.hp;
            this.setShape(this.shape.x, this.shape.y, this.radius);
            return true;
        }
        return false;   // no damage
    }

    eatDot(){
        this.hp += 1;
        this.radius = this.radiusPerHp * this.hp;
        this.setShape(this.shape.x, this.shape.y, this.radius);
    }
}

class Block extends GameObject{

    static readonly maxHp:number = 8;

    size:number;
    hp:number;

    constructor( x:number, y:number, hp:number ) {
        super();

        this.size = Util.width * BLOCK_SIZE_PER_WIDTH * 0.95;
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
                if( Ball.I.conflict( 0, r - dy + Ball.I.maxSpeed*0.2 ) ){
                    this.hp -= 1;
                    this.setShape(this.shape.x, this.shape.y);
                    if( this.hp <= 0 )
                        this.destroy();
                }
            }
            else{
                Ball.I.conflict( (dx>0 ? r : -r ) - dx, 0 );
            }
        }
        
        if( this.shape.y >= Util.height + this.size * 0.5 )
            this.destroy();
    }

    static getColor( hp:number ): number{
        let rate = Util.clamp((hp-1) / (Block.maxHp-1), 0, 1) * 0.7 + 0.3;
        return Util.color( rate, 1-rate, 1-rate*0.25);
    }
}

class DotEnergy extends GameObject{

    radius:number;

    constructor( x:number, y:number ) {
        super();

        this.radius = Util.width * BALL_SIZE_PER_WIDTH * 0.5 * 0.5;
        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(0xffc000);
        this.shape.graphics.drawCircle(0, 0, this.radius);
        this.shape.graphics.endFill();
        GameObject.display.addChild(this.shape);
        this.shape.x = x;
        this.shape.y = y;
    }
    
    update() {
        this.shape.y += Ball.I.speed;

        // collision
        let dx = Ball.I.shape.x - this.shape.x;
        let dy = Ball.I.shape.y - this.shape.y;
        let r = Ball.I.radius + this.radius;

        if( dx*dx + dy*dy < r*r ){
            Ball.I.eatDot();
            this.destroy();
        }
        
        if( this.shape.y >= Util.height )
            this.destroy();
    }
}

class BlockWave extends GameObject{

    progress:number = 0;

    constructor() {
        super();
    }
    
    update() {
        const blockSize = Util.width * BLOCK_SIZE_PER_WIDTH;
        const blockHalf = blockSize * 0.5;

        this.progress += Ball.I.speed;
        if( this.progress >= blockSize*2 ) {
            this.progress -= blockSize*2;
            
            if( Util.randomInt(0,1) === 0 ){
                for( let i=0 ; i<BLOCKS_IN_WIDTH ; i++ ){
                    if( Util.randomInt(0,2) > 0 ){
                        new Block( blockHalf + blockSize * i, -blockHalf, Util.randomInt(1,Block.maxHp) );
                    }
                }
            }
            else{
                let i = Util.randomInt(0,BLOCKS_IN_WIDTH);
                new Block( blockHalf + blockSize * i, -blockHalf, Util.randomInt(1,Block.maxHp) );

                if( Util.randomInt(0,3) === 0){
                    i = ( i + Util.randomInt(1,BLOCKS_IN_WIDTH-1) ) % BLOCKS_IN_WIDTH;
                    new DotEnergy( blockHalf + blockSize * i, -blockHalf );
                }
            }
        }
    }
}

class Background extends GameObject{

    constructor() {
        super();

        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(0x000000);
        this.shape.graphics.drawRect(0, 0, Util.width, Util.height);
        this.shape.graphics.endFill();
        GameObject.display.addChild(this.shape);
    }
    
    update() {}
}

class Score extends GameObject{

    static point:number;
    text:egret.TextField = null;

    constructor() {
        super();

        Score.point = 0;
        this.text = Util.newTextField("SCORE : 0", Util.width / 18, 0xffff00, 0.5, 0.0, true);
        GameObject.display.addChild( this.text );
    }
    
    onDestroy() {
        GameObject.display.removeChild( this.text );
        this.text = null;
    }

    update() {
        Score.point += Ball.I.speed / (Util.width * BLOCK_SIZE_PER_WIDTH);
        this.text.text = "SCORE : " + Score.point.toFixed();
    }
}

class GameOver extends GameObject{

    textGameOver:egret.TextField = null;
    textScore:egret.TextField = null;

    constructor() {
        super();

        this.textGameOver = Util.newTextField("GAME OVER", Util.width / 10, 0xffff00, 0.5, 0.45, true);
        GameObject.display.addChild( this.textGameOver );
        
        this.textScore = Util.newTextField("SCORE : " + Score.point.toFixed(), Util.width / 12, 0xffff00, 0.5, 0.55, true);
        GameObject.display.addChild( this.textScore );

        GameObject.display.once(egret.TouchEvent.TOUCH_BEGIN, (e: egret.TouchEvent) => this.tap(e), this);
    }

    onDestroy() {
        GameObject.display.removeChild( this.textGameOver );
        this.textGameOver = null;
        GameObject.display.removeChild( this.textScore );
        this.textScore = null;
    }
    
    update() { }

    tap(e:egret.TouchEvent){
        GameObject.transit = Game.init;
        this.destroy();
    }
}
