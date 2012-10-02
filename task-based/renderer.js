
define(function(require) {
    var Object = require('object');
    var resources = require('resources');
    var Cells = require('cells');

    var requestAnimFrame = (function(){
        return window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback){
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    function collides(x, y, r, b, x2, y2, r2, b2) {
        return !(r <= x2 || x > r2 ||
                 b <= y2 || y > b2);
    }

    return Object.extend({
        init: function() {
            this.w = document.body.clientWidth / 2;
            this.h = document.body.clientHeight / 2;

            this.canvas = document.getElementById('canvas');
            this.canvas.width = this.w;
            this.canvas.height = this.h;

            this.ctx = canvas.getContext('2d');
            this.objects = [];
            this.staticObjects = [];
            this.cells = new Cells(this.w, this.h, 4, 4);
            this.ctx.mozImageSmoothingEnabled = false;

            var _this = this;
            window.onresize = function() {
                this.w = document.body.clientWidth;
                this.h = document.body.clientHeight;

                _this.canvas.width = w;
                _this.canvas.height = h;
            };
        },

        start: function() {
            if(!resources.ready()) {
                var _this = this;
                resources.onReady(function() {
                    _this.start();
                    resources.onReady(null);
                });
            }
            else {
                this.lastTime = Date.now();

                this.objects.forEach(function(obj) {
                    if(obj.sprite) {
                        obj.sprite.start();
                    }
                });

                requestAnimFrame(bind(this.heartbeat, this));
            }
        },

        heartbeat: function() {
            var ctx = this.ctx;
            var now = Date.now();
            var dt = (now - this.lastTime) / 1000;
            this.lastTime = now;

            this._debugFuncs = [];

            this.objects = this.objects.reduce(function(acc, obj) {
                if(!obj._remove) {
                    obj.reset && obj.reset();

                    if(obj.update) {
                        obj.update(dt);
                    }

                    acc.push(obj);
                }

                return acc;
            }, []);

            this.checkCollisions();

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            this.objects.forEach(function(obj) {
                if(obj.render) {
                    obj.render(this.ctx);
                }

                if(this._debug && obj.pos) {
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(Math.floor(obj.pos.x),
                                   Math.floor(obj.pos.y),
                                   Math.floor(obj.size.w),
                                   Math.floor(obj.size.h));

                }
            }, this);

            if(this._debug) {
                this.cells.debug(ctx);

                this._debugFuncs.forEach(function(func) {
                    func(ctx);
                });
            }

            requestAnimFrame(bind(this.heartbeat, this));
        },

        addObject: function(obj) {
            this.objects.push(obj);

            if(obj.type == 'STATIC') {
                this.staticObjects.push(obj);
            }
        },

        removeObjects: function() {
            this.objects = [];
            this.staticObjects = [];
        },

        checkCollisions: function(args) {
            var count = 0;
            var cells = this.cells;
            cells.clear();

            function runCollision(obj, obj2) {
                var pos = obj.pos;
                var size = obj.size;
                var pos2 = obj2.pos;
                var size2 = obj2.size;

                if(collides(pos.x, pos.y,
                            pos.x + size.w, pos.y + size.h,
                            pos2.x, pos2.y,
                            pos2.x + size2.w, pos2.y + size2.h)) {
                    count++;
                    obj.onCollide && obj.onCollide(obj2, args);
                    obj2.onCollide && obj2.onCollide(obj, args);

                    if(obj.type == 'ACTIVE' && obj._moved) {
                        obj.pos = { x: obj.prevX, y: obj.prevY };
                        obj._moved = false;
                    }

                    if(obj2.type == 'ACTIVE' && obj2._moved) {
                        obj2.pos = { x: obj2.prevX, y: obj2.prevY };
                        obj2._moved = false;
                    }
                }
            }

            this.objects.forEach(function(obj) {
                if(obj.pos) {
                    obj._resolved = false;
                    var pos = obj.pos;
                    var size = obj.size;

                    if(obj.type != 'STATIC') {
                        this.staticObjects.forEach(function(stat) {
                            runCollision(obj, stat);
                        });
                    }

                    cells.add(pos.x, pos.y, obj);
                    cells.add(pos.x + size.w, pos.y, obj);
                    cells.add(pos.x, pos.y + size.h, obj);
                    cells.add(pos.x + size.w, pos.y + size.h, obj);
                }
            }, this);

            this.objects.forEach(function(obj) {
                if(obj.pos) {
                    var pos = obj.pos;
                    var size = obj.size;

                    var cls = cells.get([{x: pos.x, y: pos.y},
                                         {x: pos.x + size.w, y: pos.y},
                                         {x: pos.x, y: pos.y + size.h},
                                         {x: pos.x + size.w, y: pos.y + size.h}]);

                    cls.forEach(function(objs) {
                        objs.forEach(function(obj2) {
                            if(obj2.collidedObjs.indexOf(obj) === -1 &&
                               obj != obj2) {
                                runCollision(obj, obj2);
                                obj.collidedObjs.push(obj2);
                            }
                        }, this);
                    }, this);
                }
            }, this);

            return count;
        },

        debug: function(flag) {
            this._debug = flag;
        },

        addDebugFunc: function(func) {
            this._debugFuncs.push(func);
        }
    });
});