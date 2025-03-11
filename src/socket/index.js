import {io} from 'socket.io-client';

const options = {
    "force new connection": true,
    reconnectionAttempts: Infinity,
    timeout : 10000, // before connect_error and connect_timeout are emitted.
    transports : ["websocket"]
}

const socket = io('/', options);

export default socket;