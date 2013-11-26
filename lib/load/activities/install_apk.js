var fs = require('fs');
var http = require('http');
var spawn = require('child_process').spawn;

exports.probability = 30 / 40;
exports.startFunc = function (cfg, cb) {

var number = 3030;
// 70% of Apps are already cached (simulated by re-using 3030)
// 30% are from the long tail
if (0.7 < Math.random()) {
  number = Math.floor(Math.random() * 1000000);
}
var url = cfg.base + '/application.apk?manifestUrl=http://deltron' + number + '.testmanifest.com/manifest.webapp';

// TODO maxSockets defaults to 5?

  http.get(url, function(res) {
    if (res.statusCode >= 500) {
      cb('too much load');
    } else if (res.statusCode === 200) {
      var payload = '';
      res.on('data', function(data) {
	payload += data;
      });
      res.on('end', function() {
        var f = 'application-' + Math.random() + '.apk';
        fs.writeFile(f, payload, 'utf8', function(err) {
          if (err) {
	    console.log(err);
	    cb('Unable to write apk to disk');
	  }
          var failed = false;          
          var fproc = spawn('file', [f]);
          fproc.stdout.on('data', function(data) {
	    if (0 !== data.toString('utf8').indexOf(f + ': Zip archive data')) {
	      failed = true;
	    }
	  });
          fproc.stderr.on('data', function(data) {
            failed = true;
            console.log('stderr: ' + data);
	  });
          fproc.on('close', function() {
	    fs.unlink(f, function(err) {
	      if (err) console.error(err);
	    });
            if (true === failed) {
	      cb('Malformed APK, not a zip');
	    } else {
  	      cb(null);
	    }

	  });

	});
      });
    } else {
      cb('Unknown Error');
    }
  }).on('error', function(err) {
    console.error(err);
    cb('Unknown Error');
  });
};

if (require.main === module) {
  debug = true;

  exports.startFunc({base: 'http://127.0.0.1:8080'}, function (err) {
    if (err) {
      console.log('Finished with ERROR');
      console.error(err);
    } else {
      console.log('Finished OK');
    }
  });
}