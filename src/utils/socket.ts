import { io, Socket } from 'socket.io-client';
import { getStoredToken } from './auth';

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io({
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        const token = getStoredToken();
        if (token) {
          this.socket?.emit('auth', { token });
        }
      });
    } else if (!this.socket.connected) {
      this.socket.connect();
    }
    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public authenticate(token: string) {
    if (this.socket) {
      this.socket.emit('auth', { token });
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
