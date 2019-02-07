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
var BALL_SIZE_PER_WIDTH = BLOCK_SIZE_PER_WIDTH / 2;
var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        var _this = _super.call(this) || this;
        _this.once(egret.Event.ADDED_TO_STAGE, _this.addToStage, _this);
        return _this;
    }
    Main.prototype.addToStage = function () {
        GameObject.initial(this.stage);
        Game.init();
        // this.addEventListener(egret.Event.ENTER_FRAME,GameObject.process,this);
        egret.startTick(this.tickLoop, this);
    };
    Main.prototype.tickLoop = function (timeStamp) {
        GameObject.process();
        return false;
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
        new Background();
        new Ball();
        new BlockWave();
        new ScorePoint();
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
    GameObject.prototype.onDestroy = function () { }; // virtual method
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
        if (GameObject.transit) {
            GameObject.dispose();
            GameObject.display.removeChildren();
            GameObject.transit();
            GameObject.transit = null;
        }
    };
    GameObject.dispose = function () {
        GameObject.objects.forEach(function (obj) { obj.destroy(); obj.delete(); });
        GameObject.objects = GameObject.objects.filter(function (obj) { return false; });
        GameObject.objects = [];
    };
    GameObject.prototype.delete = function () {
        if (this.shape) {
            GameObject.display.removeChild(this.shape);
            this.shape = null;
        }
        this.onDestroy();
    };
    return GameObject;
}());
__reflect(GameObject.prototype, "GameObject");
var Ball = (function (_super) {
    __extends(Ball, _super);
    function Ball() {
        var _this = _super.call(this) || this;
        _this.defaultHp = 5;
        _this.maxHp = 15;
        _this.touchOffsetX = 0;
        _this.stopFlag = false;
        _this.invincible = 0;
        Ball.I = _this;
        console.log("Ball " + _this.toString());
        _this.hp = _this.defaultHp;
        _this.radiusPerHp = Game.width * BALL_SIZE_PER_WIDTH * 0.5 / _this.defaultHp;
        _this.radius = _this.radiusPerHp * _this.hp;
        _this.speed = _this.maxSpeed = Game.height / (3 * 60);
        _this.setShape(Game.width * 0.5, Game.height * 0.7, _this.radius);
        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, function (e) { return _this.touchBegin(e); }, _this);
        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, function (e) { return _this.touchMove(e); }, _this);
        return _this;
    }
    Ball.prototype.onDestroy = function () {
        var _this = this;
        console.log("Ball onDestroy()" + this.toString());
        GameObject.display.stage.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, function (e) { return _this.touchBegin(e); }, this);
        GameObject.display.stage.removeEventListener(egret.TouchEvent.TOUCH_MOVE, function (e) { return _this.touchMove(e); }, this);
        Ball.I = null;
    };
    Ball.prototype.setShape = function (x, y, radius) {
        if (this.shape)
            GameObject.display.removeChild(this.shape);
        this.shape = new egret.Shape();
        this.shape.graphics.beginFill(0xffc000);
        this.shape.graphics.drawCircle(0, 0, radius);
        this.shape.graphics.endFill();
        GameObject.display.addChild(this.shape);
        this.shape.x = x;
        this.shape.y = y;
    };
    Ball.prototype.update = function () {
        if (this.stopFlag) {
            this.stopFlag = false;
            this.speed = 0;
        }
        if (this.hp <= 0)
            return;
        this.speed += Game.clamp(this.maxSpeed - this.speed, 0, this.maxSpeed * 0.1);
        this.shape.y += Game.clamp(Game.height * 0.7 - this.shape.y, -1, 1);
        if (this.invincible > 0) {
            this.invincible -= 1;
            this.shape.alpha = (this.invincible & 0x4) === 0 ? 1 : 0.5;
        }
    };
    Ball.prototype.touchBegin = function (e) {
        if (this.hp <= 0)
            return;
        this.touchOffsetX = this.shape.x - e.localX;
    };
    Ball.prototype.touchMove = function (e) {
        if (this.hp <= 0)
            return;
        this.shape.x = e.localX + this.touchOffsetX;
        this.shape.x = Game.clamp(this.shape.x, this.radius, Game.width - this.radius);
        this.touchOffsetX = this.shape.x - e.localX;
    };
    Ball.prototype.conflict = function (dx, dy) {
        this.shape.x += dx;
        this.shape.y += dy;
        this.touchOffsetX += dx;
        if (dy > 0) {
            this.stopFlag = true;
        }
        if (this.invincible <= 0) {
            this.invincible = 60;
            this.hp = this.hp - 1;
            if (this.hp <= 0) {
                new GameOver();
                this.stopFlag = true;
                return;
            }
            this.radius = this.radiusPerHp * this.hp;
            this.setShape(this.shape.x, this.shape.y, this.radius);
        }
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
        GameObject.display.setChildIndex(this.shape, 2);
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
            if (Game.randomInt(0, 1) === 0) {
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
var ScorePoint = (function (_super) {
    __extends(ScorePoint, _super);
    function ScorePoint() {
        var _this = _super.call(this) || this;
        _this.score = 0;
        var text = new egret.TextField();
        GameObject.display.addChild(text);
        text.text = "SCORE:" + _this.score.toFixed();
        text.textColor = 0xffffff;
        text.x = (Game.width - text.width) / 2;
        text.y = 0; //(Game.height - text.height) / 2;
        ScorePoint.text = text;
        return _this;
    }
    ScorePoint.prototype.onDestroy = function () {
        GameObject.display.removeChild(ScorePoint.text);
        ScorePoint.text = null;
    };
    ScorePoint.prototype.update = function () {
        this.score += Ball.I.speed * 0.1;
        ScorePoint.text.text = "SCORE:" + this.score.toFixed();
    };
    ScorePoint.text = null;
    return ScorePoint;
}(GameObject));
__reflect(ScorePoint.prototype, "ScorePoint");
var GameOver = (function (_super) {
    __extends(GameOver, _super);
    function GameOver() {
        var _this = _super.call(this) || this;
        var text = new egret.TextField();
        GameObject.display.addChild(text);
        text.text = "GAME OVER";
        text.bold = true;
        text.size = Game.width / 12;
        text.textColor = 0xe000ff;
        text.x = (Game.width - text.width) / 2;
        text.y = (Game.height - text.height) / 2;
        GameOver.text = text;
        GameObject.display.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, function (e) { return _this.tap(e); }, _this);
        return _this;
    }
    GameOver.prototype.onDestroy = function () {
        var _this = this;
        GameObject.display.removeChild(GameOver.text);
        GameObject.display.stage.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, function (e) { return _this.tap(e); }, this);
        GameOver.text = null;
    };
    GameOver.prototype.update = function () { };
    GameOver.prototype.tap = function (e) {
        if (this.deleteFlag)
            return;
        GameObject.transit = Game.init;
        this.destroy();
    };
    GameOver.text = null;
    return GameOver;
}(GameObject));
__reflect(GameOver.prototype, "GameOver");
//# sourceMappingURL=Main.js.map