var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

app.get('/', function(req, res) {
  res.send('hello world')
})
// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
	// ... INSERT HERE.
	console.log(req.method, req.ural);
        client.lpush("recent", req.protocol +"://"+ req.get('host')+req.originalUrl);
        client.ltrim("recent", 0, 4);
	next(); // Passing the request to the next handler in the stack.
});
///////////// WEB ROUTES
app.get('/set', function(req, res) {
  client.set("key", "this message will self-destruct in 10 seconds");
  client.expire("key", 10); 
  res.send('key stored');
})
app.get('/get', function(req, res) {
  client.get("key", function(err,value){
    //console.log(value);
    res.send(value);});
})

app.get('/recent', function(req, res) {
   client.lrange("recent", 0, 9, function(err, reply) {
      console.log(reply);
      res.send(reply);
   })
})

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files

    if( req.files.image )
    {
 	   fs.readFile( req.files.image.path, function (err, data) {
 	  		if (err) throw err;
 	  		var img = new Buffer(data).toString('base64');
 	  		//console.log(img);
                        client.lpush("catImage", img); 
			client.ltrim("catImage",0, 4);
 		});
 	}

    res.status(204).end()
}]);

app.get('/meow', function(req, res) {
 	{
           client.lrange("catImage", 0, 4, function(err,items){
 	      if (err) throw err;
  	      res.writeHead(200, {'content-type':'text/html'});
              console.log(items);
              items.forEach(function (imagedata) {
    		 res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
		});
              res.end();
            });
 	}
})

// HTTP SERVER
var server = app.listen(3000, function () {

   var host = server.address().address
   var port = server.address().port

   console.log('Example app listening at http://%s:%s', host, port)
 })

