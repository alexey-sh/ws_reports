var xml2js = require('xml2js');
var express = require('express');
var request = require('request');
var session = require('express-session');
var _ = require('underscore');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');


var wsApiUrl = 'https://www.worksnaps.net/api/';

var app = express();
app.use(cookieParser());

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('views', __dirname + '/templates');
app.engine('html', require('ejs').renderFile);
app.set('trust proxy', 1);
app.use(cookieSession({
    name: 'session',
    signed: true,
    keys: ['test', 'key2']
}));


function toArray (i) {
    if (!_.isArray(i)) {
        return [i];
    }
    return i;
}

function convertDateForWSParams (s, end) {
    var date = new Date(s);
    if (end) {
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
    }
    else {
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
    }
    return Math.round(date.getTime()/1000);
}

function fillZero (str) {
    if (str.toString().length < 2) {
        return '0' + str;
    }
    return str;
}

function ws (url, token, done, params) {
    request.get(wsApiUrl + url, {
        auth: {
            user: token,
            pass: ''
        },
        qs: params
    }, function (error, response, body) {
        if (error) {
            done(error, null);
            return
        }
        xml2js.parseString(body, {explicitArray: false}, function (err, result) {
            if (err) {
                done(err, null);
                return
            }
            done(null, result);
        });
    });
}

app.get('/', function (req, res) {
    var sess = req.session;
    if (sess.user) {
        res.redirect('/projects');
    }
    res.render('login.html');
});

app.post('/', function (req, res) {
    ws('me.xml', req.body.token, function (err, data) {
        if (data) {
            req.session.token = req.body.token;
            console.log(req.session.token);
            res.redirect('/projects');
        }
        else {
            res.redirect('/');
        }
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.redirect('/');
    });

});

app.get('/projects', function (req, res) {
    ws('projects.xml', req.session.token, function (err, data) {
        res.render('projects.html', {projects: toArray(data.projects.project)});
    });
});

app.get('/projects/:id', function (req, res) {
    ws('projects/' + req.params.id + '.xml', req.session.token, function (err, data) {
        res.render('project.html', {project: data.project, _: _});
    });
});

app.get('/projects/:id/report', function (req, res) {
    ws('projects/' + req.params.id + '/reports.xml', req.session.token, function (err, data) {
        data = toArray(data.time_entries.time_entry);
        res.render('report.html', {
            data: data, _: _, r: function (x) {
                var hours = Math.floor(x / 60);
                var minutes = x % 60;

                return fillZero(hours) + ':' + fillZero(minutes)
            }
        });
    }, {
        name: 'time_entries',
        from_timestamp: convertDateForWSParams(req.query.from),
        to_timestamp: convertDateForWSParams(req.query.to, true)
    });
});


var server = app.listen(process.env.PORT || 9000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});