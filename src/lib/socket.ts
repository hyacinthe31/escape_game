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
    _socket = io("http://localhost:4000", {
      transports: ["websocket"],
      autoConnect: false,   // on connecte nous-mêmes
      reconnection: true,
    });
    w.__socket = _socket;
  }
  return _socket!;
}

