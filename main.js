var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var httpProxy = require('http-proxy')
// application
var app = express()

// load balancer
var lb = express()
var proxy = httpProxy.createProxyServer({});

// REDIS client
var client = redis.createClient(6379, '127.0.0.1', {})

// Proxy logic
lb.get('*', function(req, res) {
   var redirect_server = client.rpop("proxy", function(err, data) {
      console.log(data+req.url)
      client.lpush("proxy", data)
      res.redirect(data+req.url)
   })
})
 
// POST REQUEST BALANCING
lb.post('^*$', function(req, res) {
    var redirect_server = client.rpop("proxy", function(err, data) {
      console.log(data+req.url)
      client.lpush("proxy", data)
      proxy.web(req, res, { target: data });
    })
})

// Applicaiton logic
app.get('/', function(req, res) {
  res.send('hello world')
  //res.redirect('http://localhost:3000/get');
})

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
	// ... INSERT HERE.
	console.log(req.method, req.url);
        client.lpush("recent", req.protocol +"://"+ req.get('host')+req.originalUrl);
        client.ltrim("recent", 0, 4);
	next(); // Passing the request to the next handler in the stack.
});

///////////// WEB ROUTES
app.get('/set', function(req, res) {
  client.set("key", "this message will self-destruct in 10 seconds");
  client.expire("key", 10); 
  console.log("key stored");
  res.send('key stored');
})
app.get('/get', function(req, res) {
  client.get("key", function(err,value){
    console.log(value);
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

// HTTP PROXY
var loadbalancer = lb.listen(80, function () {

  var host = loadbalancer.address().address
  var port = loadbalancer.address().port

   console.log('Load balancer listening at http://%s:%s', host, port)
 })

// HTTP SERVER
var server = app.listen(3000, function () {

   var host = server.address().address
   var port = server.address().port

   console.log('Example app listening at http://%s:%s', host, port)
 })

// HTTP Additional server
var service_instance = app.listen(3001, function () {

   var host = service_instance.address().address
   var port = service_instance.address().port

   console.log('Additional Service Instance of app listening at http://%s:%s', host, port)
 })
