let http = require("http")
let fs = require("fs")

let server = http.createServer()
server.on("request", function(request, response){
    fs.readFile("index.html", "utf8", function(err, data) {
        if (err) {
            response.writeHead(404)
            response.end("page not found")
        }
        response.writeHead(200, { "Content-type": "text/html; charset=utf-8" })
        response.end(data)
    })
}) 

server.listen(80)