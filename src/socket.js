import { io } from 'socket.io-client';
const socketURL = import.meta.env.VITE_SOCKET_URL;

export const initSocket = async () => {
    const options = {
        reconnectionAttempts: Infinity,
        timeout: 10000,
        // allow polling fallback — some environments fail when forcing websocket-only
        transports: ['polling', 'websocket'],
        // ensure we hit the default socket.io path
        path: '/socket.io',
    };
    return io(socketURL, options);
};
