import { users, media, agenda } from '@index';
import { UserPermissions, AppImage, AppVideo } from '@typings/app.d';
import fs from 'fs/promises';
import path from 'path';
import nanoid from 'nanoid';

export const model = {
  access_token: ''
}

interface File {
  filepath: string;
  fieldname: string;
  mimetype: string;
}

interface FilesReq {
  saveRequestFiles(options ? : Partial < { limits: { fileSize: number; } } > ): Promise < Array < File >> ;
}

export const callback = (data: typeof model, req: FilesReq) => new Promise((ok, error) => {
  users.findOne({ access_token: data.access_token })
    .then(user => {
      if (!user) error('No user found associated with given access token!');
      else {
        if (user.permissions.contains(UserPermissions.UPLOAD_MEDIA)) {
          req.saveRequestFiles({ limits: { fileSize: 100 * 1000 } })
            .then(files => {
              let moveJobs = files
                .filter(f => f.mimetype.includes('image') || f.mimetype.includes('video'))
                .map(f => new Promise < AppImage | AppVideo > ((res, rej) => {
                  let id = nanoid();
                  let newPath = path.resolve(`../../../media/${id}.${(()=> {
                                   let a= f.filepath.split('.');
                                     return a[a.length-1];
                                    })()}`);
                  fs.rename(f.filepath, )
                    .then(() => res({ url: newPath, id: id }))
                    .catch(err => rej(err))
                }));
              Promise.all(moveJobs)
                .then(f => {
                  ok({ uploaded: f.map(x => x.id) });

                  f.forEach(x => agenda.now('create media entities', x));
                })
                .catch(err => error(err));
            })
            .catch(err => error(err));
        } else error('Current user has no permissions to process this operation!');
      }
    })
    .catch(err => error(err));
});