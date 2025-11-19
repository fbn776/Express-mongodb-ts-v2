import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import {connectDB} from "./db/config";
import authRouter from "./routes/authRoutes";
import userRouter from "./routes/usersRoutes";
import fs from "fs";
import http from "http";
import {dev_websocket_logger} from "./dev/logs/dev_websocket_logger";
import devRouter from "./routes/devRoutes";

require('dotenv').config();

const app = express();

const server = http.createServer(app);
const env = process.env.ENVIRONMENT || 'development';
if (env === 'development') {
    app.use(morgan('dev'));
    dev_websocket_logger(env, server);
}

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.use(express.json());
app.use(cors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
}));

app.use('/system_generated', express.static(__dirname + '/system_generated'));
app.use('/uploads', express.static(__dirname + '/uploads'));

app.use('/public', express.static(__dirname + '/public'));

if (env === "development") {
    app.use('/dev', express.static(__dirname + '/dev'));
}

//creating folders and files for ticket storing and log saving
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs', {recursive: true});
if (!fs.existsSync('./logs/api-logs.txt')) fs.open('./logs/api-logs.txt', 'w', (error, file) => {
    if (error) console.log(error)
});
if (!fs.existsSync('./logs/email-logs.txt')) fs.open('./logs/email-logs.txt', 'w', (error, file) => {
    if (error) console.log(error)
});
if (!fs.existsSync('./logs/sms-logs.txt')) fs.open('./logs/sms-logs.txt', 'w', (error, file) => {
    if (error) console.log(error)
});

connectDB();


//Invoking server port connection
server.listen(process.env.NODE_PORT, () => {
    console.log(`Server listening on port ${process.env.NODE_PORT}`);
    if (env === 'development') {
        console.log(`WebSocket server ready at ws://localhost:${process.env.NODE_PORT}`);
    }
});

app.get('/is-dev', (req, res) => {
    let response = {
        "success": true,
        "status": 200,
        "message": "Environment fetched successfully",
        "data": {
            environment: env,
            isDev: env === 'development'
        }
    }
    res.status(200).send(response);
});

app.use(authRouter);
app.use(userRouter);

if( env === 'development'){
    app.use(devRouter);
}


//health check API
app.get('/platform/status', (req, res) => {
    let response = {
        "success": true,
        "status": 200,
        "message": "All systems operational",
        "data": null
    }
    res.status(200).send(response);
});

//404 implementation
app.use(function (req, res) {
    let response = {
        "success": false,
        "status": 404,
        "message": "API not found",
        "data": null
    }
    res.status(404).send(response);
});
