// Ball vs Blocks
// Liberapp 2019 - Tahiti Katagai
var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = this && this.__extends || function __extends(t, e) { 
 function r() { 
 this.constructor = t;
}
for (var i in e) e.hasOwnProperty(i) && (t[i] = e[i]);
r.prototype = e.prototype, t.prototype = new r();
};
var BLOCKS_IN_WIDTH = 4;
var BLOCK_SIZE_PER_WIDTH = 1 / BLOCKS_IN_WIDTH;
var BALL_SIZE_PER_WIDTH = 1 / 12;
var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        var _this = _super.call(this) || this;
        _this.once(egret.Event.ADDED_TO_STAGE, _this.addToStage, _this);
        return _this;
    }
    Main.prototype.addToStage = function () {
        Game.init();
        GameObject.initial(this.stage);
        new Background();
        new Ball();
        new BlockWave();
        this.addEventListener(egret.Event.ENTER_FRAME, GameObject.process, this);
    };
    return Main;
}(egret.DisplayObjectContainer));
__reflect(Main.prototype, "Main");
var Game = (function () {
    function Game() {
    }
    Game.init = function () {
        this.height = egret.MainContext.instance.stage.stageHeight;
        this.width = egret.MainContext.instance.stage.stageWidth;
    };
    Game.random = function (min, max) {
        return min + Math.random() * (max - min);
    };
    Game.randomInt = function (min, max) {
        return Math.floor(min + Math.random() * (max + 0.999 - min));
    };
    Game.clamp = function (value, min, max) {
        if (value < min)
            value = min;
        if (value > max)
            value = max;
        return value;
    };
    Game.color = function (r, g, b) {
        return (Math.floor(r * 0xff) * 0x010000 + Math.floor(g * 0xff) * 0x0100 + Math.floor(b * 0xff));
    };
    return Game;
}());
__reflect(Game.prototype, "Game");
var GameObject = (function () {
    function GameObject() {
        this.shape = null;
        GameObject.objects.push(this);
    }
    GameObject.prototype.destroy = function () { this.deleteFlag = true; };
    GameObject.initial = function (displayObjectContainer) {
        GameObject.objects = [];
        GameObject.display = displayObjectContainer;
    };
    GameObject.process = function () {
        GameObject.objects.forEach(function (obj) { return obj.update(); });
        GameObject.objects = GameObject.objects.filter(function (obj) {
            if (obj.deleteFlag)
                obj.delete();
            return (!obj.deleteFlag);
        });
    };
    GameObject.dispose = function () {
        this.objects.forEach(function (obj) { return obj.delete(); });
        GameObject.objects = [];
    };
    GameObject.prototype.delete = function () {
        if (this.shape) {
            GameObject.display.removeChild(this.shape);
            this.shape = null;
        }
    };
    return GameObject;
}());
__reflect(GameObject.prototype, "GameObject");
var Ball = (function (_super) {
    __extends(Ball, _super);
    function Ball() {
        var _this = _super.call(this) || this;
        _this.touchOffsetX = 0;
        _this.stopFlag = false;
        Ball.I = _this;
        _this.radius = Game.width * BALL_SIZE_PER_WIDTH * 0.5;
        _this.maxSpeed = Game.height / (2 * 60);
        _this.speed = _this.maxSpeed;
        _this.shape = new egret.Shape();
        _this.shape.graphics.beginFill(0xffc000);
        _this.shape.graphics.drawCircle(0, 0, _this.radius);
        _this.shape.graphics.endFill();
        GameObject.display.addChild(_this.shape);
        _this.shape.x = Game.width * 0.5;
        _this.shape.y = Game.height * 0.7;
        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, function (e) { return _this.touchBegin(e); }, _this);
        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, function (e) { return _this.touchMove(e); }, _this);
        return _this;
    }
    Ball.prototype.update = function () {
        if (this.stopFlag) {
            this.stopFlag = false;
            this.speed = 0;
        }
        this.speed += Game.clamp(this.maxSpeed - this.speed, 0, this.maxSpeed * 0.1);
        this.shape.y += Game.clamp(Game.height * 0.7 - this.shape.y, -1, 1);
    };
    Ball.prototype.touchBegin = function (e) {
        this.touchOffsetX = this.shape.x - e.localX;
        console.log("touchBegin " + this.touchOffsetX);
    };
    Ball.prototype.touchMove = function (e) {
        this.shape.x = e.localX + this.touchOffsetX;
        this.shape.x = Game.clamp(this.shape.x, this.radius, Game.width - this.radius);
        this.touchOffsetX = this.shape.x - e.localX;
        //console.log( "touchMove " + this.shape.x );
    };
    Ball.prototype.conflict = function (dx, dy) {
        this.shape.x += dx;
        this.shape.y += dy;
        this.touchOffsetX += dx;
        if (dy > 0)
            this.stopFlag = true;
    };
    Ball.I = null; // singleton instance
    return Ball;
}(GameObject));
__reflect(Ball.prototype, "Ball");
var Block = (function (_super) {
    __extends(Block, _super);
    function Block(x, y, hp) {
        var _this = _super.call(this) || this;
        _this.size = Game.width * BLOCK_SIZE_PER_WIDTH * 0.9;
        _this.hp = hp;
        _this.setShape(x, y);
        return _this;
    }
    Block.prototype.setShape = function (x, y) {
        if (this.shape)
            GameObject.display.removeChild(this.shape);
        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(Block.getColor(this.hp));
        this.shape.graphics.drawRect(-0.5 * this.size, -0.5 * this.size, this.size, this.size);
        this.shape.graphics.endFill();
        GameObject.display.addChild(this.shape);
        this.shape.x = x;
        this.shape.y = y;
    };
    Block.prototype.update = function () {
        this.shape.y += Ball.I.speed;
        // collision
        var dx = Ball.I.shape.x - this.shape.x;
        var dy = Ball.I.shape.y - this.shape.y;
        var r = Ball.I.radius + this.size * 0.5;
        var dx2 = dx * dx;
        var dy2 = dy * dy;
        var rr = r * r;
        if (dx2 < rr && dy2 < rr) {
            if (dx2 < dy2 && dy > 0) {
                Ball.I.conflict(0, r - dy + Ball.I.maxSpeed * 0.2);
                this.hp -= 1;
                this.setShape(this.shape.x, this.shape.y);
                if (this.hp <= 0)
                    this.destroy();
            }
            else {
                Ball.I.conflict((dx > 0 ? r : -r) - dx, 0);
            }
        }
        if (this.shape.y >= Game.height)
            this.destroy();
    };
    Block.getColor = function (hp) {
        var rate = Game.clamp((hp - 1) / (Block.maxHp - 1), 0, 1);
        return Game.color(rate, 1 - rate, 1 - rate * 0.25);
    };
    Block.maxHp = 64;
    return Block;
}(GameObject));
__reflect(Block.prototype, "Block");
var BlockWave = (function (_super) {
    __extends(BlockWave, _super);
    function BlockWave() {
        var _this = _super.call(this) || this;
        _this.progress = 0;
        return _this;
    }
    BlockWave.prototype.update = function () {
        var blockSize = Game.width * BLOCK_SIZE_PER_WIDTH;
        var blockHalf = blockSize * 0.5;
        this.progress += Ball.I.speed;
        if (this.progress >= blockSize * 2) {
            this.progress -= blockSize * 2;
            if (Game.randomInt(0, 1) == 0) {
                for (var i = 0; i < 6; i++) {
                    if (Game.randomInt(0, 3) > 0) {
                        new Block(blockHalf + blockSize * i, 0, Game.randomInt(1, Block.maxHp));
                    }
                }
            }
            else {
                var i = Game.randomInt(0, BLOCKS_IN_WIDTH);
                new Block(blockHalf + blockSize * i, 0, Game.randomInt(1, Block.maxHp));
            }
        }
    };
    return BlockWave;
}(GameObject));
__reflect(BlockWave.prototype, "BlockWave");
var Background = (function (_super) {
    __extends(Background, _super);
    function Background() {
        var _this = _super.call(this) || this;
        _this.shape = new egret.Shape();
        _this.shape.graphics.beginFill(0x000000);
        _this.shape.graphics.drawRect(0, 0, Game.width, Game.height);
        _this.shape.graphics.endFill();
        GameObject.display.addChild(_this.shape);
        return _this;
    }
    Background.prototype.update = function () { };
    return Background;
}(GameObject));
__reflect(Background.prototype, "Background");
//# sourceMappingURL=Main.js.map