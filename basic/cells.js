
define(function(require) {
    var Object = require('object');

    return Object.extend({
        init: function(w, h, numX, numY) {
            this.w = w;
            this.h = h;
            this.numX = numX;
            this.numY = numY;
            this.clear();
        },

        clear: function() {
            var total = this.numX*this.numY;

            this.cells = new Array(total);
            for(var i=0; i<total; i++) {
                this.cells[i] = [];
            }
        },

        add: function(x, y, obj) {
            if(x > 0 && y > 0 && 
               x < this.w && y < this.h) {
                x = Math.floor(x / (this.w / this.numX));
                y = Math.floor(y / (this.h / this.numY));
                this.cells[this.numX * y + x].push(obj);
            }
        },

        get: function(points) {
            var res = [];
            
            points.forEach(function(p) {
                var x = p.x;
                var y = p.y;

                if(x > 0 && y > 0 &&
                   x < this.w && y < this.h) {
                    x = Math.floor(x / (this.w / this.numX));
                    y = Math.floor(y / (this.h / this.numY));
                    var i = this.numX * y + x;

                    if(res.indexOf(this.cells[i]) === -1) {
                        res.push(this.cells[i]);
                    }
                }
            }, this);

            return res;
        },

        debug: function(ctx) {
            ctx.fillStyle = 'rgba(255, 0, 0, .2)';
            var stepX = this.w / this.numX;
            var stepY = this.h / this.numY;

            for(var i=0; i<this.cells.length; i++) {
                var x = i % this.numX;
                var y = Math.floor(i / this.numX);

                if(this.cells[i].length > 0) {
                    ctx.fillRect(x * stepX,
                                 y * stepY,
                                 stepX,
                                 stepY);
                }
            }
        }
    });
});