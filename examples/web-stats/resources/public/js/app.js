/* app.js */

App = function () {
    var self = {};

    self.statsInterval = 1000;

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

    self.fetchStats = function () {
        // console.log("fetch stat data");
        $.get('/stats',self.receiveStats);
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
        self.fetchStats();
        setInterval(self.fetchStats,self.statsInterval);
        $('#stop-emitter').attr('disabled','disabled');
        $('#post-event').click(self.submitEvent);
        $('#post-rand').click(self.randomStockEvent);
        $('#start-emitter').click(self.startEmitter);
        $('#stop-emitter').click(self.stopEmitter);
    };

    return self;
}();

$(document).ready(App.init);
