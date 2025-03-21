// /* eslint-disable no-undef */
//
//
// const path = require('path');
// const express = require('express');
// const app = express();
// const server = require('http').createServer(app);
// const io = require('socket.io')(server);
// const {version, validate} = require('uuid');
//
// const ACTIONS = require('./src/socket/actions');
// const PORT = process.env.PORT || 3001;
//
//
//
/* eslint-disable no-undef */

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { version, validate } from 'uuid';
import ACTIONS from './src/socket/actions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5173;

function getClientRooms() {
    const {rooms} = io.sockets.adapter;
    console.log('Room getClientRooms()', rooms);
    return Array.from(rooms.keys()).
    filter(roomID => validate(roomID) && version(roomID) === 4);
}

function shareRoomsInfo() {
    io.emit(ACTIONS.SHARE_ROOMS, {
        rooms: getClientRooms()
    })
}

io.on('connection', socket => {
    shareRoomsInfo();

    socket.on(ACTIONS.JOIN, config => {
        const {room: roomID} = config;
        const {rooms: joinedRooms} = socket;

        if (Array.from(joinedRooms).includes(roomID)) {
            return console.warn(`Osygan ${roomID}-ge kirip qoigansyn`);
        }

        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

        clients.forEach(clientID => {
            io.to(clientID).emit(ACTIONS.ADD_PEER, {
                peerID: socket.id,
                createOffer: false
            });

            socket.emit(ACTIONS.ADD_PEER, {
                peerID: clientID,
                createOffer: true,
            });
        });

        socket.join(roomID);
        shareRoomsInfo();
    });

    function leaveRoom() {
        const {rooms} = socket;

        Array.from(rooms)
            // LEAVE ONLY CLIENT CREATED ROOM
            .filter(roomID => validate(roomID) && version(roomID) === 4)
            .forEach(roomID => {

                const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

                clients
                    .forEach(clientID => {
                        io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
                            peerID: socket.id,
                        });

                        socket.emit(ACTIONS.REMOVE_PEER, {
                            peerID: clientID,
                        });
                    });

                socket.leave(roomID);
            });

        shareRoomsInfo();
    }

    socket.on(ACTIONS.LEAVE, leaveRoom);
    socket.on('disconnecting', leaveRoom);

    socket.on(ACTIONS.RELAY_SDP, ({peerID, sessionDescription}) => {
        io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
            peerID: socket.id,
            sessionDescription,
        });
    });

    socket.on(ACTIONS.RELAY_ICE, ({peerID, iceCandidate}) => {
        io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
            peerID: socket.id,
            iceCandidate,
        });
    });

});

const publicPath = path.join(__dirname, 'build');

app.use(express.static(publicPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

server.listen(PORT, () => {
    console.log('Server Started!')
})