declare module 'porla' {
  interface PorlaTorrent {
    name: string;
  }
  interface PorlaApp {
    on(event: 'torrent.finsished', cb: (args: { torrent: PorlaTorrent }) => void): void;
  }
  interface PorlaAppPlugin {

  }
  interface PorlaAppOptions {
    announce: Array < string > ;
    plugins: Array < PorlaAppPlugin > ;
    savePath: string;
  }
  export default function makePorlaApp(options ? : Partial < PorlaAppOptions > ): PorlaApp;
}