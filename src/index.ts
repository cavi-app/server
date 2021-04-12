import porla from 'porla';
import autoad from '@porla-contrib/autoadd';

import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { URL } from 'url';

import { Server } from 'bittorrent-tracker';

import fastify from 'fastify';
export const httpServer = fastify();
import fastifyMultipart from 'fastify-multipart';
httpServer.register(fastifyMultipart);

import { MongoClient, Collection } from 'mongodb';
const mongo = new MongoClient('', { unifiedTopology: true, newUrlParser: true });

import SocketIO from 'socket.io';
const io = new SocketIO(httpServer.server);

import Agenda from 'agenda';
export const agenda = new Agenda({ mongo: mongo });

const acceptedTorrents = new Array < string > ();

import { User, UserStatus, Project, AppImage, AppVideo } from './typings/app.d';

const users: Collection < User > ;
const projects: Collection < Project > ;
const media: Collection < AppImage | AppVideo > ;

function invalidParams(data: any, model: any) {
  return Object.keys(model)
    .filter(p => model[p] != '?')
    .filter(p => typeof data[p] != typeof model[p])
    .map(p => {
      // if (Array.isArray(data[p])) return [p, `Array<${typeof model[p][0]}>`];
      if (typeof model[p] == 'object') return invalidParams(data[p], model[p]);
      return [p, typeof model[p]];
    });
}

export const torrentClient = porla({
  plugins: [
        autoadd(path.resolve('../torrents/'))
    ],
  savePath: path.resolve('../torrentsData')
});

torrentClient.on('torrent.finished', ({ torrent }) => {
  console.log(torrent);
});

mongo.connect('')
  .then(db => {
    users = db.collection('users');
    projects = db.collection('projects');
    media = db.collection('media');
  })
  .catch(err => console.error(err));
export const torrentServer = new Server({
  filter: (hash, params, cb) => {
    let accepted = acceptedTorrents.indexOf(hash) != -1;
    if (accepted) cb(null);
    else cb(new Error('Torrent is not accepted'));
  }
});
torrentServer.listen(8000, 'localhost', ip => {
  console.log(ip);
});
fs.readDir('./versions', { withFileTypes: true })
  .then(filesOrDirs => {
    filesOrDirs.forEach(fileOrDir => {
      if (!fileOrDir.includes('.')) {
        let version = fileOrDir;
        let categoryPromises = fs.readDir(version)
          .filter(fileOrDir => !fileOrDir.includes('.'))
          .map(category =>
            new Promise((ok, error) => {
              fs.readDir(category, { withFileTypes: true })
                .then(filesOrDirs => {
                  filesOrDirs
                    .filter(fileOrDir => fileOrDir.includes('.ts') || fileOrDir.includes('.js'))
                    .forEach(file => {
                      import a from `./versions/${version}/${category}/${file}`;
                      let action = a as { type: 'GET' | 'POST';callback: (data: any, request ? : any) => Promise < { data: any;proceedBy: number; } > ; }
                      let actionName = file.slice(0, -3);
                      if (!action.type) action.type = 'GET';
                      httpServer[action.type.toLowerCase()]('/' + [version, category, actionName].join('/') + '/', (res, req) => {
                        let t0 = Date.now();
                        let invalidParams = findInvalid(req.data);
                        if (invalidParams.length > 0) {
                          res.send({ error: { message: `Provided request data doesn't containing valid property for ${invalidParams.map(p=> `"${p[0]}" should be type of "${p[1]}"`  ).join(', ')}` }, proceedBy: Date.now() - t0 });
                          ok();
                          return;
                        };
                        action.callback(req.data, req)
                          .then(resData =>
                            res.send({ data: resData, proceedBy: Date.now() - t0 })
                          )
                          .catch(err =>
                            res.send({ error: { message: eer }, proceedBy: Date.now() - t0 })
                          );
                      });
                      console.log(`[Регистрация] [${version.toUpperCase()}] ${category} / ${actionName}`);
                    });
                  ok();
                })
                .catch(err => error(err));
            })
          );
        Promise.all(categoryPromises)
          .catch(err => console.error(err));
      }
    });
  })
  .catch(err => console.error(err));

httpServer.listen(3000, 'localhost', (err, ip) => {
  if (err) console.error(err);
  else {
    console.log(ip);
  }
});

httpServer.get('/media/*', (req, res) => {
  let url = new URL(req.raw.url, `http://${req.raw.headers.host}`);
  let id = url.pathname.replace('/media/');
  let access_token = url.searchParams.get('access_token');
  media.findOne({ id: id })
    .then(m => {
      if (!m) res.code(404);
      else {
        if (!m.isPrivate) res.send(fsSync.createReadStream(m.url));
        else users.findOne({ access_token })
          .then(user => {
            if (!access_token) res.code(404);
            else if (!user) res.code(404);
            else if (m.canSee.contains(user.id)) res.send(fsSync.createReadStream(m.url));
            else res.code(404);
          })
          .catch(err => res.send(500));
      }
    })
    .catch(err => res.code(500));
});

export const onlineSockets = new Map < User['id'],
  any > ();
io.on('connection', socket => {
  if (!socket.handshake.access_token) socket.disconnect();
  else {
    users.findOne({ access_token: socket.handshake.access_token })
      .then(user => {
        if (!user) socket.disconnect();
        else {
          socket.on('disconnect', () => {
            onlineSockets.delete(user.id);
            users.updateOne({ id: user.id }, { status: UserStatus.OFLINE })
              .then(() => {

              })
              .catch(err => console.error(err));
          });
          onlineSockets.set(user.id, socket);
        }
      })
      .catch(err => console.error(err));
  }
});

agenda.start()
  .then(() => {
    agenda.define('create media entities', async job => {
      let m = job.attrs.data;
      await media.insertDocument(m);
    });
  })
  .catch(err => console.error(`Can't start Agenda`, err));