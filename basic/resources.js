
define(function(require) {
    var Object = require('object');
    var resourceCache = {};
    var loading = [];
    var readyCallback = null;

    function loadResource(url) {
        if(resourceCache[url]) {
            return resourceCache[url];
        }
        else {
            var img = new Image();
            img.onload = function() {
                resourceCache[url] = img;
                
                if(ready() && readyCallback) {
                    readyCallback();
                }
            };
            resourceCache[url] = false;
            img.src = url;
        }
    }

    function getResource(url) {
        return resourceCache[url];
    }

    function ready() {
        var ready = true;
        for(var k in resourceCache) {
            if(!resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    function onReady(func) {
        readyCallback = func;
    }

    var Sprite = Object.extend({
        init: function(url, x, y, w, h, speed, frames) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.speed = speed;
            this.frames = frames;
            this._index = 0;
            this.url = url;
            this.scaleX = 1;
            this.scaleY = 1;

            loadResource(url);
        },

        update: function(dt) {
            this._index += this.speed*dt;
        },

        setScale: function(x, y) {
            this.scaleX = x;
            this.scaleY = y;
        },

        flipHorizontal: function(val) {
            this.flipHoriz = val;
        },

        getNumFrames: function() {
            if(this.speed === 0) {
                return 1;
            }
            else if(this.frames) {
                return this.frames.length;
            }
            else {
                return Math.floor(getResource(this.url).width / this.w);
            }
        },
        
        render: function(ctx, x, y, clipX, clipY) {
            var frame;
            var max = this.getNumFrames();
            clipX = clipX || this.w;
            clipY = clipY || this.h;

            if(this.frames) {
                frame = this.frames[Math.floor(this._index) % max];
            }
            else {
                frame = Math.floor(this._index % max);
            }

            ctx.save();
            
            if(this.flipHoriz) {
                ctx.translate(x + this.w * this.scaleX, y);
                ctx.scale(-this.scaleX, this.scaleY);
            }
            else {
                ctx.translate(x, y);
                ctx.scale(this.scaleX, this.scaleY);
            }
            
            ctx.drawImage(getResource(this.url),
                          this.x + frame * this.w, this.y,
                          Math.min(this.w, clipX), Math.min(this.h, clipY),
                          0, 0,
                          Math.min(this.w, clipX), Math.min(this.h, clipY));
            ctx.restore();
        }
    });

    return { 
        loadResource: loadResource,
        getResource: getResource,
        onReady: onReady,
        ready: ready,
        Sprite: Sprite
    };
});