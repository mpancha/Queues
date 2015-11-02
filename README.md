HW 3 
====

get/set
-------------------------
/set will set the key = "this message will self-destruct in 10 seconds" on redis server. The key will be deleted by redis server after 10 seconds.

/get will fetch the key value from the redis server.

/get after 10 seconds of /set will return null. 

recent
------------------------
/recent will show the recent history of pages visited. We are using a list named "recent" on redis server to maintain the history of visited pages. The global hook will add the url to the list and limit the list to 5 pages using ltrim. Visiting /recent will dump the recent pages using lrange.

upload/meow
-----------------------------
POST on /upload will save the payload image in "catImage" list. This list is limited to 5 images using ltrim.

GET on /meow will fetch the images from "catImage" list and display on page.

Additional service instance
---------------------------
Service instances are running on port 3000 and 3001.

![image](screenshots/netstat.png)

Proxy
-------------
Load balancer is running on port 80.
The load balancer will redirect the requests to either port 3000 or port 3001 based on value of proxy list.
On recieving any GET request on port 80, rpop is performed on proxy list and redirection request is sent to the IP:port fetched from list. And IP:port is pushed to the bottom of the proxy list. The proxy list is initialized with localhost:3000 and localhost:3001 and hence the requests will be redirected to 3000 and 3001 alternatively.

Code
-----
![main.js](main.js)

Screencast
----------
![screencast](https://youtu.be/omyJhZWAMb0)
