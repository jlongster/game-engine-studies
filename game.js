
define(function(require) {
    var Renderer = require('renderer');
    var Object = require('object');
    var Input = require('input');
    var resources = require('resources');
    
    var input = new Input();

    var Entity = Object.extend({
        type: 'ACTIVE',

        init: function(x, y, w, h) {
            this.pos = { x: x || 0, y: y || 0 };
            this.size = { w: w || 50, h: h || 50 };
            this.offset = { x: 0, y: 0 };
            this.collidedObjs = [];
        },

        move: function(x, y) {
            if(this.prevX === null) {
                this.prevX = this.pos.x;
            }

            if(this.prevY === null) {
                this.prevY = this.pos.y;
            }

            this.pos.x = x;
            this.pos.y = y;
            this._moved = true;
        },

        moveX: function(x) {
            this.move(x, this.pos.y);
        },

        moveY: function(y) {
            this.move(this.pos.x, y);
        },

        adjust: function(x, y) {
            this.move(this.pos.x + x,
                      this.pos.y + y);
        },

        adjustX: function(x) {
            this.adjust(x, 0);
        },

        adjustY: function(y) {
            this.adjust(0, y);
        },

        reset: function() {
            this._moved = false;
            this.prevX = null;
            this.prevY = null;
            this.collidedObjs = [];
        },

        render: function(ctx) {
            if(this.sprite) {
                this.sprite.render(ctx,
                                   this.pos.x - this.offset.x,
                                   this.pos.y - this.offset.y);
            }
        }
    });

    var Player = Entity.extend({
        type: 'ACTIVE',

        init: function(x, y, speed, sprite) {
            this.parent(x, y, 50, 20);
            this.offset = { x: 15, y: 7.5 };
            this.speed = speed || 10;

            this.sideSprite = new resources.Sprite('resources/bosses.png',
                                                   0, 395,
                                                   80, 35,
                                                   6,
                                                   [0, 1, 2]);
            this.upSprite = new resources.Sprite('resources/bosses.png',
                                                 200, 430,
                                                 40, 40,
                                                 6,
                                                 [0, 1, 2]);
            this.downSprite = new resources.Sprite('resources/bosses.png',
                                                   0, 430,
                                                   40, 40,
                                                   6,
                                                   [0, 1, 2]);

            this.sprite = this.sideSprite;
        },

        update: function(dt) {
            var anim = false;
            this.lastSprite = this.sprite;

            if(input.isDown('up')) {
                this.adjustY(-this.speed * dt);
                this.sprite = this.upSprite;
                this.size = { w: 22, h: 30 };
                this.offset = { x: 8, y: 7 };
                anim = true;
            }

            if(input.isDown('down')) {
                this.adjustY(this.speed * dt);
                this.sprite = this.downSprite;
                this.size = { w: 22, h: 30 };
                this.offset = { x: 8, y: 7 };
                anim = true;
            }

            if(input.isDown('left')) {
                this.adjustX(-this.speed * dt);
                this.sprite = this.sideSprite;
                this.sprite.flipHorizontal(false);
                this.size = { w: 50, h: 20 };
                this.offset = { x: 15, y: 7.5 };
                anim = true;
            }

            if(input.isDown('right')) {
                this.adjustX(this.speed * dt);
                this.sprite = this.sideSprite;
                this.sprite.flipHorizontal(true);
                this.size = { w: 50, h: 20 };
                this.offset = { x: 15, y: 7.5 };
                anim = true;
            }

            if(this.lastSprite == this.sprite) {
                this.lastSprite = null;
            }

            if(anim) {
                //this.sprite.update(dt);
            }
        }
    });

    var Enemy = Entity.extend({
        type: 'ACTIVE',

        init: function(x, y, w, h, speed, offset, sprite) {
            this.parent(x, y, w, h);
            this.offset = offset;
            this.sprite = sprite;
            this.speed = speed || 5;
        },

        update: function(dt) {
            var targetPos = this.targetPos;

            if(this.nextX && this.nextY) {
                this.pos.x = this.nextX;
                this.pos.y = this.nextY;
                this.nextX = null;
                this.nextY = null;
            }

            if(!targetPos) {
                if(Math.random() < .5) {
                    targetPos = { axis: 'x',
                                  start: this.pos.x };
                }
                else {
                    targetPos = { axis: 'y',
                                  start: this.pos.y };
                }

                targetPos.length = Math.random()*500;
                targetPos.neg = Math.random() < .5;
                this.targetPos = targetPos;
            }

            if(targetPos.axis == 'x') {
                if(targetPos.neg &&
                   this.pos.x > targetPos.start - targetPos.length) {
                    this.adjustX(-this.speed * dt);
                }
                else if(!targetPos.neg &&
                        this.pos.x < targetPos.start + targetPos.length) {
                    this.adjustX(this.speed * dt);
                }
                else {
                    this.targetPos = null;
                }
            }
            else if(targetPos.axis == 'y') {
                if(targetPos.neg &&
                   this.pos.y > targetPos.start - targetPos.length) {
                    this.adjustY(-this.speed * dt);
                }
                else if(!targetPos.neg &&
                        this.pos.y < targetPos.start + targetPos.length) {
                    this.adjustY(this.speed * dt);
                }
                else {
                    this.targetPos = null;
                }
            }

            //this.sprite.update(dt);
        },

        onCollide: function(obj, args) {
            if(this._moved) {
                this.targetPos = null;
            }

            if(obj instanceof Enemy && args && args[0] && !obj._resolved) {
                var startX = Math.max(this.pos.x, obj.pos.x);
                var endX = Math.min(this.pos.x + this.size.w,
                                    obj.pos.x + obj.size.w);
                var startY = Math.max(this.pos.y, obj.pos.y);
                var endY = Math.min(this.pos.y + this.size.h,
                                    obj.pos.y + obj.size.h);

                if(startX < this.pos.x) {
                    this.pos.x += endX - this.pos.x;
                }
                else {
                    this.pos.x -= (this.pos.x + this.size.w) - startX;
                }

                this._resolved = true;

                //var vol = vecX*vecX + vecY*vecY;

                // renderer.addDebugFunc(function(ctx) {
                //     ctx.fillStyle = 'rgba(0, 200, 0, .4)';
                //     ctx.fillRect(startX, startY, endX - startX, endY - startY);
                // });
            }

            if(obj instanceof Player) {
                if(obj._moved) {
                    if(obj.lastSprite) {
                        obj.sprite = obj.lastSprite;
                        obj.lastSprite = null;
                    }
                    else {
                        obj.pos.x = obj.prevX;
                        obj.pos.y = obj.prevY;
                    }
                }

                this.remove();
            }
        },

        remove: function() {
            this._remove = true;
        },

        reset: function() {
            this.parent();
        }
    });

    var Floor = Object.extend({
        init: function(sprite) {
            this.sprite = sprite;
        },

        update: function(dt) {
            this.sprite.update(dt);
        },

        render: function(ctx) {
            for(var i=0; i<renderer.w; i+=this.sprite.w) {
                for(var j=0; j<renderer.h; j+=this.sprite.h) {
                    this.sprite.render(ctx, i, j);
                }
            }
        }
    });

    var Static = Entity.extend({
        type: 'STATIC',

        init: function(x, y, w, h, sprite) {
            this.parent(x, y, w, h);
            this.sprite = sprite;
        },

        render: function(ctx) {
            if(this.sprite) {
                for(var i=0; i<this.size.w; i+=this.sprite.w) {
                    for(var j=0; j<this.size.h; j+=this.sprite.h) {
                        this.sprite.render(ctx,
                                           this.pos.x + i,
                                           this.pos.y + j,
                                           this.size.w - i,
                                           this.size.h - j);
                    }
                }
            }
            else {
                ctx.fillStyle = 'rgb(100, 100, 100)';
                ctx.fillRect(this.pos.x, this.pos.y,
                             this.size.w, this.size.h);
            }
        },

        onCollide: function(obj, args) {
            if(obj.type != 'STATIC' && args && args[0]) {
                obj.remove();
            }
        }
    });

    var Trigger = Entity.extend({
        type: 'STATIC',

        init: function(x, y, w, h, func) {
            this.parent(x, y, w, h);
            this.callback = func;
        },

        onCollide: function(obj, args) {
            args = args || [];
            if(obj instanceof Player && !args[0]) {
                this.callback();
            }
        }
    });

    var renderer = new Renderer();
    var wall = new resources.Sprite('resources/dungeon.png',
                                      74, 79,
                                      16, 16,
                                      0);

    function addScene() {
        renderer.addObject(
            new Floor(new resources.Sprite('resources/dungeon.png',
                                           31, 46,
                                           16, 16,
                                           0))
        );

        renderer.addObject(new Trigger(-10, 0, 10, renderer.h, leftScreen));
        renderer.addObject(new Trigger(0, -10, renderer.w, 10, topScreen));
        renderer.addObject(new Trigger(renderer.w, 0, 10, renderer.h, rightScreen));
        renderer.addObject(new Trigger(0, renderer.h, renderer.w, 10, bottomScreen));
    }

    function testScreen() {
        renderer.removeObjects();
        addScene();
    }

    function firstScreen() {
        renderer.removeObjects();
        addScene();

        renderer.addObject(new Static(50, Math.random() * 300 + 100, 100, 100, wall));
        renderer.addObject(new Static(Math.random() * 300 + 100, 100, 100, 100, wall));
        renderer.addObject(player);

        for(var i=0; i<10; i++) {
            var sprite;
            var offset;
            var w, h;

            if(Math.random() < .8) {
                sprite = new resources.Sprite('resources/bosses.png',
                                              0, 154,
                                              40, 35,
                                              4,
                                              [0, 1, 2, 3]);
                offset = { x: 4, y: 2.5 };
                w = sprite.w - 8;
                h = sprite.h - 5;
            }
            else {
                sprite = new resources.Sprite('resources/bosses.png',
                                              0, 111,
                                              240/6, 40,
                                              6,
                                              [0, 1, 2, 3, 4, 5]);
                offset = { x: 0, y: 0 };
                w = sprite.w;
                h = sprite.h;
            }

            sprite._index = Math.ceil(Math.random() * 2);
            renderer.addObject(
                new Enemy(Math.random() * (renderer.w - w),
                          Math.random() * (renderer.h - h),
                          w,
                          h,
                          Math.random()*50 + 25,
                          offset,
                          sprite)
            );
        }

        for(var i=0; i<20; i++) {
            if(renderer.checkCollisions([true]) == 0) {
                break;
            }        
        }
    }

    function leftScreen() {
        var playerX = renderer.w - player.size.w;
        var playerY = player.pos.y;
        firstScreen();
        player.pos.x = playerX;
        player.pos.y = playerY;
    }

    function topScreen() {
    }

    function rightScreen() {
    }

    function bottomScreen() {
    }

    var player = new Player(50, 50, 100);
    firstScreen();

    // setTimeout(function() {
    //     setInterval(function() {
    //         console.log('rendering');

    //         renderer.objects.forEach(function(obj) {
    //             obj.reset && obj.reset();
    //             obj.render(renderer.ctx);
    //         });

    //         renderer.checkCollisions([true]);
    //     }, 1000);
    // }, 1000);

    renderer.start();
    window.renderer = renderer;

    var collisionDbg = document.getElementById('collision');

    if(collisionDbg.checked) {
        renderer.debug(true);
    }

    collisionDbg.addEventListener('click', function() {
        if(collisionDbg.checked) {
            renderer.debug(true);
        }
        else {
            renderer.debug(false);
        }
    });
});