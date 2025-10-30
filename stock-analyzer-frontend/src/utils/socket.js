import io from 'socket.io-client';

// Create Socket.IO connection
const socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Socket event handlers for debugging
socket.on('connect', () => {
  console.log('🔌 Connected to server via WebSocket');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection error:', error);
});

export default socket;