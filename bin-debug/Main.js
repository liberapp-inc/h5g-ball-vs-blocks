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
var BLOCK_SIZE_PER_WIDTH = 1 / 6;
var BALL_SIZE_PER_WIDTH = 1 / 10;
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
        new Ball();
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
    Game.clamp = function (value, min, max) {
        if (value < min)
            value = min;
        if (value > max)
            value = max;
        return value;
    };
    return Game;
}());
__reflect(Game.prototype, "Game");
var GameObject = (function () {
    function GameObject() {
        GameObject.objects.push(this);
    }
    GameObject.prototype.destroy = function () { this.deleteFlag = true; };
    GameObject.initial = function (displayObjectContainer) {
        GameObject.objects = [];
        GameObject.displayContainer = displayObjectContainer;
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
        if (this.display) {
            GameObject.displayContainer.removeChild(this.display);
            this.display = null;
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
        _this.radius = Game.width * BALL_SIZE_PER_WIDTH * 0.5;
        _this.shape = new egret.Shape();
        _this.shape.graphics.beginFill(0x00ffe0);
        _this.shape.graphics.drawCircle(0, 0, _this.radius);
        _this.shape.graphics.endFill();
        GameObject.displayContainer.addChild(_this.shape);
        _this.shape.x = Game.width * 0.5;
        _this.shape.y = Game.height * 0.7;
        GameObject.displayContainer.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, function (e) { return _this.touchBegin(e); }, _this);
        GameObject.displayContainer.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, function (e) { return _this.touchMove(e); }, _this);
        return _this;
    }
    Ball.prototype.update = function () {
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
    return Ball;
}(GameObject));
__reflect(Ball.prototype, "Ball");
//# sourceMappingURL=Main.js.map