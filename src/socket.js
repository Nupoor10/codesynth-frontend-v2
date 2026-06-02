import { io } from 'socket.io-client';
const socketURL = import.meta.env.VITE_SOCKET_URL;

export const initSocket = async () => {
  const options = {
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ['polling', 'websocket'],
    path: '/socket.io',
  };
  return io(socketURL, options);
};
