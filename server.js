let http = require("http")
let fs = require("fs")
let url = require("url")

let server = http.createServer()
server.on("request", function(request, response){
    fs.readFile("index.html", "utf8", function(err, data) {
        if (err) {
            response.writeHead(404)
            response.end("page not found")
        }
        response.writeHead(200, { "Content-type": "text/html; charset=utf-8" })
        let query = url.parse(request.url, true).query
        if (query.name === undefined) {
        } else {
            let name = query.name
            response.end("parsing name = "+ query.name)
            data = data.replace("{{ name }}", name)
        }
        response.end(data)
    })
}) 

server.listen(80)