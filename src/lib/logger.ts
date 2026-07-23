//About Pino: https://getpino.io/#/
import pino from 'pino';
import pretty from 'pino-pretty';

// Conditionally import pino-pretty and create a stream only if in development
let prettyStream;
//console.log("NODE_ENV: ", process.env.NODE_ENV);

if (process.env.NODE_ENV === 'development') {
    //Create a stream that uses pino-pretty
    prettyStream = pretty({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
        levelFirst: false
    });
}



export const logger = pino({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    base: process.env.NODE_ENV === 'development' ? null : {}, 
}, prettyStream);