const http = require('http');
const app = require('./app');
const server = http.createServer(app)
server.listen(555, function() {
    console.log('Bienvenue sur receuil de chant')
});
