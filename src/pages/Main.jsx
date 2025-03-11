import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { v4 } from "uuid";
import socket from "../socket";
import ACTIONS from "../socket/actions";

export default function Main() {
    const navigate = useNavigate();
    const [rooms, updateRooms] = useState([]);
    const rootNode = useRef(null);

    useEffect(() => {
        socket.on(ACTIONS.SHARE_ROOMS, ({ rooms = [] } = {}) => {
            if (rootNode.current) {
                updateRooms(rooms);
            }
        });

        return () => {
            //при анмаунте, очистка
            socket.off(ACTIONS.SHARE_ROOMS);
        };
    }, []);

    return (
        <div ref={rootNode}>
            <h1>Әңгіме бөлмелері</h1>

            <ul>
                {rooms.map((roomID) => (
                    <li key={roomID}>
                        {roomID}
                        <button onClick={() => navigate(`/room/${roomID}`)}>Әңгімеге қосылу</button>
                    </li>
                ))}
            </ul>

            <button onClick={() => navigate(`/room/${v4()}`)}>Әңгімені бастау</button>
        </div>
    );
}
