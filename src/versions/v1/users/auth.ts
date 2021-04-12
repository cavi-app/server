import { User } from '@typings/app.d';
import { users } from '@index';
import nanoid from 'nanoid';
import hash from 'pbkdf2';

export const model = {
  access_token: '?',
  username: '?',
  password: '?'
}

export const callback = (data: Partial < typeof model > ) => new Promise((ok, error) => {
  users.findOne(typeof data.username == 'string' ? { username: data.username } : { access_token: data.access_token })
    .then(user => {
      if (!user) {
        hash.pbkdf2(data.password, process.env.HASH_SALT, 1, 32, 'sha512')
          .then(saltedPass => {
            users.insertOne({ id: nanoid(), username: data.username, password: saltedPass, access_token: nanoid() })
              .then(u => ok({ access_token: u.access_token }))
              .catch(err => error(err));
          })
          .catch(err => error(err));
      } else {
        if (typeof data.password != 'string') error(`Provided request data doesn't containing valid property for "password". Should be type of "string"`);
        if (user.access_token != data.access_token) error('You passed wrong aceess token. Maybe it was deprecated?');
        let newToken = nanoid();
        users.updateOne({ access_token: user.access_token }, { access_token: newToken })
          .then(() => ok({ access_token: newToken }))
          .catch(err => error(err));
      }
    })
    .catch(err => error(err));
});