// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

var AstarNode = cc.Class({
    /**
     * @param {Object} parent 
     * @param {cc.Vec2} tiledCoord
     * @param {int} f
     * @param {int} g
     * @param {int} h
     */
    ctor: function(){
        this.parent = null;    
        this.tiledCoord = null;  // tiledMap里的坐标
        this.f = 0;
        this.g = 0;
        this.h = 0;
    },
    getF: function(){
        return this.g + this.h;
    }
});

cc.Class({
    extends: cc.Component,

    properties: {
        tiledMap: {
            default: null,
            type: cc.TiledMap
        },
        tiledLogicLayer: {
            tooltip: "用来标记障碍物",
            default: null,
            type: cc.TiledLayer
        },
        openList: {
            visible: false,
            default: null
        },
        closeList: {
            visible: false,
            default: null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
    },

    start () {

    },

    findWay: function(startGlPostion ,desGlPosition){
        var desTilePos = this.gl2tiledPositon(desGlPosition);
        var startTilePos = this.gl2tiledPositon(startGlPostion);
        if (this._isBarrier(desTilePos)){
            cc.log("desTilePos" + desTilePos.toString() + " is barrier.");
            return;
        }
        if (desTilePos.equals(startTilePos)){
            cc.log("起始点相同。");
            return;
        }
        this.openList = [];
        this.closeList = [];
        var startNode = new AstarNode();
        startNode.tiledCoord = startTilePos;
        this._insertToOpenList(startNode);
        do {
            // 获取最小f值的节点
            var curNode = this.openList[0];
            // 把当前节点加入到关闭列表里
            this.closeList.push(curNode);
            // 当前节点从开放列表移除
            this.openList.shift();
            // 如果当前节点和目标节点相同则找到路径
            if (curNode.tiledCoord.equals(desTilePos)){
                cc.log("find a way!");
                var shorPath = this._createPath(curNode);
                this.openList.splice(0, this.openList.length);
                this.closeList.splice(0,this.closeList.length);
                return shorPath;
            }
            var neighbourTilePos = this._getNeighbouringNodes(curNode);
            for (var i=0; i<neighbourTilePos.length; i++){
                var neighbourNode = new AstarNode();
                neighbourNode.tiledCoord = neighbourTilePos[i];
                // 判断节点是否已经在关闭列表里
                if (this._isArrayContainAstarNode(this.closeList, neighbourNode)){
                    continue;
                }
                // 计算节点到下一步的花费
                var cost = this._countCurTile2NeighbourTileCost(startNode, neighbourNode);
                neighbourNode.parent = curNode;
                neighbourNode.g = curNode.g + cost;
                neighbourNode.h = this._countCostToDestWithManhattan(neighbourNode.tiledCoord, desTilePos);
                // 计算节点是否已经在开放列表里
                var index = this._indexNodeInArray(this.openList, neighbourNode);
                if (index === -1){
                    this._insertToOpenList(neighbourNode);
                } else{
                    // 已经在开放列表里
                    // 比较F值大小
                    var oldNode = this.openList[index];
                    if (neighbourNode.g < oldNode.g){
                        // 本条线路更优，则把之前的节点移除, 重新计算g值重新加入开放列表里
                        this.openList.splice(index,1);
                        this._insertToOpenList(neighbourNode);
                    }
                }
            }

        }while(this.openList.length > 0);
        cc.log("no way found!");
        return null;
    },

    /**
     * 创建路径
     */
    _createPath: function(node){
        var points = [];
        do {
            points.push(node.tiledCoord);
            node = node.parent;
        }while(node.parent != null);
        points.reverse();
        return points;
    },

    /**
     * 根据麦哈顿城市街区估算法计算节点到目的地的花费
     */
    _countCostToDestWithManhattan: function(tilePos, destTilePos){
        return Math.abs(destTilePos.x - tilePos.x) + Math.abs(destTilePos.y - tilePos.y);
    },

    /**
     * 获取相邻节点走动花费(G值)
     */
    _countCurTile2NeighbourTileCost: function(curNode, neighbourNode){
        // 上下左右 均为10
        // 斜对角 为 14
        var value = 10;
        if (curNode.tiledCoord.x !== neighbourNode.tiledCoord.x && curNode.y !== neighbourNode.tiledCoord.y){
            value = 14;
        }
        return value;
    },
    /**
     * @param {AstarNode} node 
     * 插入到开放列表里
     * 自动按照节点的F值从小到大排序
     */
    _insertToOpenList: function(node){
        for(var i=0; i<this.openList.length; i++){
            var tmp = this.openList[i];
            if (node.getF() < tmp.getF()){
                break;
            }
        }
        this.openList.splice(i, 0, node);
    },

    _isArrayContainAstarNode: function(array, node){
        var tmp = null;
        var res = false;
        for (var i=0; i<array.length; i++){
            tmp = array[i];
            if (tmp.tiledCoord.equals(node.tiledCoord)){
                res = true;
                break;
            }
        }
        return res;
    },

    _indexNodeInArray: function(node, array){
        var index = -1;
        var tmp = null;
        for (var i=0; i<array.length; i++){
            tmp = array[i];
            if (tmp.tiledCoord.equals(node.tiledCoord)){
                index = i;
                break;
            }
        }
        return index;
    },

    /**
     * @param {AstarNode} node
     * @returns {Array} 
     * 获取相邻的节点
     */
    _getNeighbouringNodes: function(node){
        // todo: 可以选择八方向寻路
        var nodesArr = [];
        // up
        cc.Vec2
        var upPos = node.tiledCoord.sub(cc.v2(0,1));
        if (this._isValidTileCoord(upPos) && !this._isBarrier(upPos)){
            nodesArr.push(upPos);
        }

        // down
        var downPos = node.tiledCoord.add(cc.v2(0, 1));
        if (this._isValidTileCoord(downPos) && !this._isBarrier(downPos)){
            nodesArr.push(downPos);
        }

         // left
         var leftPos = node.tiledCoord.sub(cc.v2(1, 0));
         if (this._isValidTileCoord(leftPos) && !this._isBarrier(leftPos)){
             nodesArr.push(leftPos);
         }

         // right
         var rightPos = node.tiledCoord.add(cc.v2(1, 0));
         if (this._isValidTileCoord(rightPos) && !this._isBarrier(rightPos)){
             nodesArr.push(rightPos);
         }

         return nodesArr;
    },

    /**
     * 判断指定地图位置是否是障碍物
     */
    _isBarrier: function(tilePos){
        var desGID = this.tiledLogicLayer.getTileGIDAt(tilePos);
        if (desGID){
            var properties = this.tiledMap.getPropertiesForGID(desGID);
            if (properties && properties.isBarrier){
                return true;
            }
        }
        return false;
    },

    /**
     * @param {cc.V2} tilePos
     * @returns {Boolean} 
     */
    _isValidTileCoord: function(tilePos){
        var res = true;
        var tiledMapSize = this.tiledMap.getMapSize();
        if (tilePos.x < 0 || tilePos.y < 0 || tilePos.x >= tiledMapSize.width || tilePos.y >= tiledMapSize.height){
            res = false;
        }
        return res;
    },

    /**
     * 地图和屏幕一样大
     * gl坐标转换成TiledMap地图块坐标(左上角0,0)
     * @returns cc.V2
     */
    gl2tiledPositon: function(glPos){
        var tileSize = this.tiledMap.getTileSize();
        var tiledMapSize = this.tiledMap.getMapSize();
        var x = Math.floor(glPos.x / tileSize.width);
        var y = Math.floor((tiledMapSize.height*tileSize.height - glPos.y) / tileSize.height);
        x = x<tiledMapSize.width?x:tiledMapSize.width-1;
        y = y<tiledMapSize.height?y:tiledMapSize.height-1;
        return cc.v2(x,y);
    },
    /**
     * 地图和屏幕一样大
     * TiledMap地图块坐标转换成gl坐标(左下角0,0)
     */
    tile2glPosition: function(tiledPos){
        var tileSize = this.tiledMap.getTileSize();
        var tiledMapSize = this.tiledMap.getMapSize();
        var x = tiledPos.x * tileSize.width + tileSize.width/2;
        var y = tiledMapSize.height * tileSize.height - tiledPos.y * tileSize.height - tileSize.height / 2;
        return cc.v2(x,y);
    }
    // update (dt) {},
});
