import { media } from '@index';

export const model = {
  id: ''
}

export const callback = (data: typeof model) => new Promise((ok, error) => {
  media.findOne({ id: data.id })
    .then(media => ok(media))
    .catch(err => error(err));
});