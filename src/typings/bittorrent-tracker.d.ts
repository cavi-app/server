declare module 'bittorrent-tracker' {
  interface BitTorrentTrackerServerOptions {
    udp: boolean;
    http: boolean;
    ws: boolean;
    stats: boolean;
    filter: (infoHash: string, params: any, cb: (response: null | Error) => void) => void;
  }
  
  interface TorrentData {
    complete: number;
    incomplete: number;
    seeds: number;
  }

  export class Server {
    udp: any;
    http: any;
    ws: any;

    listen(port: number, host: string, cb: (ip: string) => void): void;

    torrents: {
      [key: string]: TorrentData;
    }

    constructor(opts: Partial < BitTorrentTrackerServerOptions > ) {}
  }
}