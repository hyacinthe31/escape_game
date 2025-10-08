// /lib/socket.ts
import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("Socket dispo uniquement côté client");
  }
  if (_socket) return _socket;

  // Survie au HMR : on range l’instance sur window
  const w = window as any;
  if (w.__socket) {
    _socket = w.__socket as Socket;
  } else {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    _socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });
    w.__socket = _socket;
  }
  return _socket!;
}

