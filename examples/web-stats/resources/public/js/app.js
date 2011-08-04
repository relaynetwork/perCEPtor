/* app.js */

App = function () {
    var self = {};

    self.statsInterval = 1000;

    self.receiveStats = function (data) {
        console.log("got stats: %s", data);
        console.dir(data);
        $('#stat-info').html('');
        $.each(data[0].result,function (k,v) {
                   var key = v[0];
                   var val = v[1];
                   console.dir(k);
                   console.dir(v);
                   $('#stat-info').append(key + ": " + val + "\n");
               });
        $('#stat-info').append((new Date()).toString());
    };

    self.fetchStats = function () {
        console.log("fetch stat data");
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

    self.init = function () {
        self.fetchStats();
        setInterval(self.fetchStats,self.statsInterval);
        $('#post-event').click(self.submitEvent);
    };

    return self;
}();

$(document).ready(App.init);
