import {io, Socket} from 'socket.io-client';
import {API_BASE_URL} from '../config/apiConfig';

const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');

let socket: Socket | null = null;

export const initializeSocket = (userId: string | number) => {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {transports: ['websocket'], reconnection: true});
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    socket?.emit('join', String(userId));
  });
  socket.on('disconnect', () => console.log('[Socket] Disconnected'));
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const sendMessage = (data: {
  sender_id: number | string;
  receiver_id: number | string;
  message: string;
}) => {
  socket?.emit('send_message', data);
};

export const onReceiveMessage = (callback: (data: any) => void) => {
  socket?.off('receive_message');
  socket?.on('receive_message', callback);
};

export const onMessageSent = (callback: (data: any) => void) => {
  socket?.off('message_sent');
  socket?.on('message_sent', callback);
};

export const emitTyping = (data: {sender_id: number | string; receiver_id: number | string; isTyping: boolean}) => {
  socket?.emit('typing', data);
};

export const onUserTyping = (callback: (data: {sender_id: string; isTyping: boolean}) => void) => {
  socket?.off('user_typing');
  socket?.on('user_typing', callback);
};

export const joinPostRoom = (postId: number | string) => {
  socket?.emit('join_post', String(postId));
};

export const leavePostRoom = (postId: number | string) => {
  socket?.emit('leave_post', String(postId));
};

export const onNewAnnouncement = (callback: (data: any) => void) => {
  socket?.off('new_announcement');
  socket?.on('new_announcement', callback);
};
