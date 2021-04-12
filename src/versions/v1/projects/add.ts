import { User, Project, UserPermissions } from '@typings/app.d';
import { projects, users } from '@index';

export const model = {
  access_token: '',
  name: '',
  description: '',
  videos: [''],
  images: ['']
}

export const callback = (data: typeof model) => new Promise((ok, error) => {
  users.findOne({
      access_token: data.access_token
    })
    .then(user => {
      if (!user) error('No user found associated with given access token!');
      else {
        if (user.permissions.contains(UserPermissions.ADD_PROJECTS)) {
          projects.insertDocument({})
            .then(() => ok())
            .catch(err => error(err));
        } else error('Current user has no permissions to process this operation!');
      }
    })
    .catch(err => console.error(err));
});