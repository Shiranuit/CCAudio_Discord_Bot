import { OpusEncoder } from '@discordjs/opus';
import { WebSocketServer } from 'ws';

export type AudioCallback = (data: Buffer) => void;

export class AudioTransmitter {
  private wss?: WebSocketServer;
  private encoder: OpusEncoder;
  private channels: Map<string, AudioCallback[]>

  constructor () {
    this.encoder = new OpusEncoder(48000, 2);
    this.channels = new Map();
  }

  async init() {
    const emitter = this;
    this.wss = new WebSocketServer({ port: 8080 });
    this.wss.on('connection', function connection(ws, req) {
      console.log('Connection: ' + req.socket.remoteAddress);
      const guildId = req.headers['guildid'];
      const userId = req.headers['userid'];
      const encoding = req.headers['encoding'];

      if (!guildId) {
        console.log('Missing guildId');
        ws.close(1007, 'Missing guildId');
        return;
      }

      if (!userId) {
        console.log('Missing userId');
        ws.close(1007, 'Missing userId');
        return;
      }

      const _sendBuffer = (data: Buffer) => {
        const buff = [];
        
        for (let i = 0; i < data.length; i += 4) {
          buff.push(Math.floor(data.readInt16LE(i)/256)+128);
        }

        let downSampled = Buffer.from(Uint8Array.from(buff));
        if (encoding === 'base64') {
          ws.send(downSampled.toString('base64'));
        } else {
          ws.send(downSampled, { binary: true });
        }
      }
    
      emitter.listen(guildId.toString(), userId.toString(), _sendBuffer);

      ws.on('close', () => {
        emitter.stop(userId.toString(), userId.toString(), _sendBuffer);
        console.log('Closed: ' + req.socket.remoteAddress);
      });

      ws.on('error', (err) => {
        emitter.stop(userId.toString(), userId.toString(), _sendBuffer);
        console.log(err);
      });
    });

    this.wss.on('listening', () => {
      console.log('Listening websocket connections');
    })
  }

  sendAudio(guildId: string, userId: string, data: Buffer) {
    const callbacks = this.channels.get(`${guildId}-${userId}`);
    if (callbacks) {
      for (let i = 0; i < callbacks.length; i++) {
        callbacks[i](data);
      }
    }
  }

  listen(guildId: string, userId: string, callback: AudioCallback) {
    const key = `${guildId}-${userId}`;
    let callbacks = this.channels.get(key);

    if (!callbacks) {
      callbacks = [];
      this.channels.set(key, callbacks);
    }

    if (callbacks.indexOf(callback) === -1) {
      callbacks.push(callback);
    }
  }

  stop(guildId: string, userId: string, callback: AudioCallback) {
    const callbacks = this.channels.get(`${guildId}-${userId}`);

    if (callbacks) {
      const index = callbacks.indexOf(callback);

      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}