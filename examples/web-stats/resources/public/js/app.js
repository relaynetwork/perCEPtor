/* app.js */

App = function () {
    var self = {};

    self.refreshInterval = 1000;

    self.receiveStats = function (data) {
        // console.log("got stats: %s", data);
        //console.dir(data);
        $('#stat-info').html('');
        $.each(data[0].result,function (k,v) {
                   var key = v[0];
                   var val = v[1];
                   $('#stat-info').append(key + ": " + val + "\n");
               });
        $('#stat-info').append((new Date()).toString());
    };

    self.refresh = function () {
        $.get('/stats',self.receiveStats);
        $.get('/stock/' + $('#stock').val(),self.drawGraph);
        setTimeout(self.refresh,self.refreshInterval);
    };

    self.submitEvent = function () {
        try {
            $.post("/event/new",$('#event').serialize());
            return false;
        }
        catch (x) {
            console.log("Error: %s", x);
            return false;
        }
    };

    self.randomStockEvent = function () {
        try {
            $('#price').val(Math.random() * 10);
            $.post("/event/new",$('#event').serialize());
            return false;
        }
        catch (x) {
            console.log("Error: %s", x);
            return false;
        }
    };

    self.runEmitter = false;

    self.emitterFn = function () {
        self.randomStockEvent();

        if ( self.runEmitter) {
            setTimeout(self.emitterFn,parseInt($('#emitter-interval').val()));
        }
    };
    self.startEmitter = function () {
        self.runEmitter = true;
        $('#start-emitter').attr('disabled','disabled');
        $('#stop-emitter').removeAttr('disabled');
        self.emitterFn();
        return false;
    };

    self.stopEmitter = function () {
        self.runEmitter = false;
        $('#stop-emitter').attr('disabled','disabled');
        $('#start-emitter').removeAttr('disabled');
        return false;
    };

    self.init = function () {
        $('#stop-emitter').attr('disabled','disabled');
        $('#post-event').click(self.submitEvent);
        $('#post-rand').click(self.randomStockEvent);
        $('#start-emitter').click(self.startEmitter);
        $('#stop-emitter').click(self.stopEmitter);
        self.refresh();
    };

    self.drawGraph = function (stockData) {
        $('#graph').html('');
        self.raphael = Raphael("graph",400,400);
        var x = [], y = [];
        $.each(stockData[0].result,function(idx,data) {
                   x[idx] = idx;
                   y[idx] = data.price;
               });

        // var x = [], y = [], y2 = [], y3 = [];
        // for (var i = 0; i < 1e6; i++) {
        //     x[i] = i * 10;
        //     y[i] = (y[i - 1] || 0) + (Math.random() * 7) - 3;
        //     y2[i] = (y2[i - 1] || 150) + (Math.random() * 7) - 3.5;
        //     y3[i] = (y3[i - 1] || 300) + (Math.random() * 7) - 4;
        // }

        // self.raphael.g.text(160, 10, "Simple Line Chart (1000 points)");
        // self.raphael.g.text(480, 10, "shade = true (10,000 points)");
        // self.raphael.g.text(160, 250, "shade = true & nostroke = true (1,000,000 points)");
        // self.raphael.g.text(480, 250, "Symbols, axis and hover effect");

        // self.raphael.g.linechart(10, 10, 300, 220, x, [y.slice(0, 1e3), y2.slice(0, 1e3), y3.slice(0, 1e3)])

        self.raphael.g.linechart(10, 10, 300, 220, x, [y])
            .hoverColumn(function () {
                             this.set = self.raphael.set(
                                 self.raphael.g.disc(this.x, this.y[0]),
                                 self.raphael.g.disc(this.x, this.y[1]),
                                 self.raphael.g.disc(this.x, this.y[2])
                             );
                         }, function () {
                             this.set.remove();
                         });
    };

    return self;
}();

$(document).ready(App.init);
