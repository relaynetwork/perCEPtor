/* app.js */

App = function () {
    var self = {};

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
        setTimeout(self.refresh,1000);
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

    self.refreshInterval = function () {
        try {
            var interval = parseInt($('#emitter-interval').val());
            return interval;
        } catch (x) {
            console.log("Unable to parse #emitter-interval: '%s'", $('#emitter-interval'));
            return 1000;
        }
    };

    self.emitterFn = function () {
        self.randomStockEvent();

        if ( self.runEmitter) {
            setTimeout(self.emitterFn,self.refreshInterval());
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
        self.doDrawGraph();
    };

    self.fetchGraphData = function () {
        $.get('/stock/' + $('#stock').val(), self.drawGraph);
    };

    self.doDrawGraph = function () {
        $.get('/stock/' + $('#stock').val(), function (d) {
                  self.drawGraph(d);
                  setTimeout(self.doDrawGraph,1000);
              });
    };

    self.averageArray = function (ary) {
        var total = 0.0, len = ary.length;
        for (var ii = 0 ; ii < len; ii++ ) {
            total = total + ary[ii];
        }
        return( total / (1.0 * len) );
    };

    self.kalFilt = function(a) {
        var copy = a.slice(0).sort();
        var mid = Math.floor(copy.length / 2);
        return copy[mid];
    };

    self.drawGraph = function (stockData) {

        $('#graph').html('');

        if ( stockData[0].result.length < 1) {
            return;
        }

        self.raphael = Raphael("graph",400,400);
        var x_vals = [], y_vals = [],
        avgs = [], avgWindow = [], avgWidth = 10,
        kal = [], kalWin = [], kalWidth = 7;


        for(var ii = 0; ii < avgWidth; ii++ ) {
            avgWindow[ii] = stockData[0].result[ii].price;
        }

        for(var ii = 0; ii < kalWidth; ii++ ) {
            kalWin[ii] = stockData[0].result[ii].price;
        }

        $.each(stockData[0].result,function(idx,data) {
                   x_vals[idx] = idx;
                   y_vals[idx] = data.price;
                   avgWindow.push(data.price);
                   avgWindow.shift();
                   kalWin.push(data.price);
                   kalWin.shift();
                   kal[idx] = self.kalFilt(kalWin);
                   avgs[idx] = self.averageArray(avgWindow);
               });
        self.raphael.g.linechart(10, 10, 300, 220, x_vals, [y_vals,avgs,kal]);
    };

    return self;
}();

$(document).ready(App.init);
