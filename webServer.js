"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');

mongoose.connect('mongodb://localhost/cs142project6', { useMongoClient: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));

// Additional modules for assignment 7
var secretKey = 'abcdefg'
app.use(session({secret: secretKey, resave: false, saveUninitialized: false}));
app.use(bodyParser.json());


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    var query = User.find({});
    query.select("_id first_name last_name").exec(function (err, info) {
        if (err) {
            // Query returned an error.  We pass it back to the browser with an Internal Service
            // Error (500) error code.
            console.error('Doing /user/list error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (info.length === 0) {
            // Query didn't return an error but didn't find the SchemaInfo object - This
            // is also an internal error return.
            response.status(500).send('No users found');
            return;
        }

        // We got the object - apparently with express do not need to Stringify objects
        var infoCopy = JSON.parse(JSON.stringify(info));
        response.status(200).send(infoCopy);
    });
});

/*
 * URL /user/stats/:id - Return the photo and comment count for a user
 */
app.get('/user/stats/:id', function (request, response) {
  /* MongoDB  is poorly documented here. For aggregate need to make a new objectID */
  var id = new mongoose.mongo.ObjectID(request.params.id);
  var stats = {};

  async.parallel([function (callback) {
    Photo.count({user_id: id}, function (err, count) {
      if (err) {
        // Query returned an error.  We pass it back to the browser with an Internal Service
        // Error (500) error code.
        console.error('Doing photo count error:', err);
        callback(err);
        return;
      }
      
      // We received the count
      stats.photoCount = count;
      callback();
    });
  }, function (callback) {
    /* Aggregate pipeline. Note matching twice to prefilter */
    Photo.aggregate([ {$match: {"comments.user_id": id}}, 
                      {$unwind: "$comments"},
                      {$match: {"comments.user_id": id}}, 
                      {$count: "comment_count"}
                      ], function (err, info) {
      if (err) {
        // Query returned an error.  We pass it back to the browser with an Internal Service
        // Error (500) error code.
        console.error('Doing comments count error:', err);
        callback(err);
        return;
      }
      
      // We received the count
      stats.commentCount = info[0].comment_count;
      callback();
    });
  }], function (err) {
    if (err) {
      if (err.name === 'CastError') {
        response.status(400).send(JSON.stringify(err));
      } else {
        response.status(500).send(JSON.stringify(err));
      }
    } else {
      stats.user_id = request.params.id;
      response.status(200).send(stats);
    }
    console.log("Done");
  });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
  var id = request.params.id;

  User.find({_id: id}, function (err, info) {
    if (err) {
      // Query returned an error.  We pass it back to the browser with an Internal Service
      // Error (500) error code.
      console.error('Doing /user/:id error:', err);
      if (err.name === 'CastError') {
        response.status(400).send(JSON.stringify(err));
      } else {
        response.status(500).send(JSON.stringify(err));
      }
      return;
    }
    if (info.length === 0) {
      // Query didn't return an error but didn't find the User object - This
      // This becomes a 400 error
      console.log('User with _id:' + id + ' not found.');
      response.status(400).send('Not found');
      return;
    }

    // We got the object - create a copy so we can modify it
    var returnData = JSON.parse(JSON.stringify(info))[0];
    delete returnData.__v;
    response.status(200).send(returnData);
  });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
  var id = request.params.id;

  Photo.find({user_id: id}, function (err, info) {
    if (err) {
      // Query returned an error.  We pass it back to the browser with an Internal Service
      // Error (500) error code.
      console.error('Doing /user/:id error:', err);
      if (err.name === 'CastError') {
        response.status(400).send(JSON.stringify(err));
      } else {
        response.status(500).send(JSON.stringify(err));
      }
      return;
    }
    if (info.length === 0) {
      // Query didn't return an error but didn't find the User object - This
      // This becomes a 400 error
      console.log('Photos for user with _id:' + id + ' not found.');
      response.status(400).send('Not found');
      return;
    }

    // We got the object - create a copy so we can modify it
    var returnData = JSON.parse(JSON.stringify(info));

    // Iterate over the collection, starting parallel mongo requests to get the user data
    async.each(returnData, function (dataElem, done_callback) {
      async.each(dataElem.comments, getUserComments, function (err) {
        if (err) {
          done_callback(err)
        } else {
          delete dataElem.__v;
          done_callback();
        }
      });
    }, function (err) {
      if (err) {
        response.status(500).send(JSON.stringify(err));
      } else {
        response.status(200).send(returnData);
      }
    });
  });
});

/*
 * URL /commentsOfUser/:id - Return the Comments for User (id)
 */
app.get('/commentsOfUser/:id', function (request, response) {

  /* TODO: Need to return the comments along with the photos. */
  var id = new mongoose.mongo.ObjectID(request.params.id);
  var stats = {};

  Photo.aggregate([ {$match: {"comments.user_id": id}}, 
                    {$unwind: "$comments"},
                    {$match: {"comments.user_id": id}},
                    ], function (err, info) {
    if (err) {
      // Query returned an error.  We pass it back to the browser with an Internal Service
      // Error (500) error code.
      console.error('Doing comments count error:', err);
      if (err.name === 'CastError') {
        response.status(400).send(JSON.stringify(err));
      } else {
        response.status(500).send(JSON.stringify(err));
      }
    } else {
      var returnData = JSON.parse(JSON.stringify(info));
      returnData = returnData.map(elem => {
        return {
          comment: elem.comments.comment, 
          date_time: elem.comments.date_time,
          user_id: elem.user_id,
          photo_id: elem._id,
          photo_file_name: elem.file_name,
      }});
      response.status(200).send(returnData);
    }
  });
});

function getUserComments (commentElem, comment_done_callback) {
  User.find({_id: commentElem.user_id}, function (err, info) {
        if (err) {
            // Query returned an error.  We pass it back to the browser with an Internal Service
            // Error (500) error code.
            console.error('Retrieving user data for a comment: ', err);
            comment_done_callback(err)
            return;
        }
        if (info.length === 0) {
            // Query didn't return an error but didn't find the User object - This
            // This becomes a 400 error
            console.log('User with _id:' + id + ' not found when searching comments.');
            comment_done_callback('User not found');
            return;
        }

        // We got the object - create a copy so we can modify it
        var userData = JSON.parse(JSON.stringify(info))[0];
        delete commentElem.user_id;
        commentElem.user = { 
          first_name: userData.first_name,
          last_name: userData.last_name,
          _id: userData._id,
        };
        comment_done_callback();
    });
}


var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


