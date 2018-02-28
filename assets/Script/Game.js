// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

cc.Class({
    extends: cc.Component,

    properties: {
        tiledMap: {
            default: null,
            type: cc.TiledMap
        },
        playerFrame: {
            default: null,
            type: cc.SpriteFrame
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        var mapRelSize = this.tiledMap.node.getContentSize();
        var objectLayer = this.tiledMap.getObjectGroup("sprite");
        var startObj = objectLayer.getObject("startPosition");
        var endObj = objectLayer.getObject("endPosition");

        var player = this.player = new cc.Node("player");
        var component = player.addComponent(cc.Sprite);
        component.spriteFrame = this.playerFrame;
        this.tiledMap.node.addChild(player);
        var p = startObj.getProperties();

        player.x = -mapRelSize.width/2 + startObj.getProperties().x;
        player.y = mapRelSize.height/2 - startObj.getProperties().y;

        this.node.on('touchstart', this.onTouchStart, this);
        this.node.on('touchend', this.onTouchEnd, this);

    },
    onTouchStart: function(touch){
        var astar = this.node.getComponent("Astar");
        cc.log("touch:" + touch.getLocation().x+ ", " + touch.getLocation().y);
        var startPos = this.tiledMap.node.convertToWorldSpaceAR(this.player.position);
        cc.log("startPos:" + startPos.toString());

        var path = this.path = astar.findWay(startPos, touch.getLocation());
        if (path){
            cc.log("path: " + path.length);
            cc.log(path.toString());
            this._clearTileMapPathColor();
            //
            for (var i=0; i<path.length; i++){
                var tilePos = path[i];
                var tile = this.tiledMap.getLayer("back").getTileAt(tilePos);
                tile.color = cc.color(255,255,0,255);
            }
        }
    },

    _movePlayerWithPath: function(dt){
        if (this.path && this.path.length > 0){
            var astar = this.node.getComponent("Astar");
            var pos = this.path.shift();
            pos = this.tiledMap.node.convertToNodeSpaceAR(astar.tile2glPosition(pos));
            this.player.runAction(cc.moveTo(0.2,pos));
        } else{
            this.unschedule(this._movePlayerWithPath);
        }
    },

    _clearTileMapPathColor: function(){
        var mapSize = this.tiledMap.getMapSize();
        for(var row=0; row<mapSize.width; row++){
            for(var col=0; col<mapSize.height; col++){
                var tile = this.tiledMap.getLayer("back").getTileAt(cc.v2(row, col));
                tile.color = cc.Color.WHITE;
            }
        }
    },

    onTouchEnd: function(touch){
        this.schedule(this._movePlayerWithPath, 0.2);
    },

    // start () {

    // },

    // update (dt) {},
});
