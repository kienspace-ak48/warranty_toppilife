const app = require('./app');
const { envPath } = require('./configs/myPath');
const http = require('http');
require('dotenv').config({
    path: envPath
});
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const httpServer = http.createServer(app);
const dbConnection = require('./configs/dbConnection');


async function startServer(){
    try{
        await dbConnection.connect();
        httpServer.listen(HTTP_PORT, () => {
            console.log(`📊 MongoDB readyState: ${dbConnection.getConnection().readyState}`);
            console.log(`🚀 Server is running on http://localhost:${HTTP_PORT}`);
        });
    } catch (error) {
        console.error('🔴 Error connecting to MongoDB:', error.message);
        httpServer.close(() => {
            console.log('Server is shutting down');
        });
        process.exit(1);
    }
    
}

startServer();