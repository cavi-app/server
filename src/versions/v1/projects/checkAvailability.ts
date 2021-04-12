import { Project } from '@typings/app.d';
import { projects } from '@index';

export const model = {
  url: ''
}

export const callback = (data: typeof model) => new Promise((ok, error) => {
  projects.findOne({ url: data.url })
    .then(project => ok({ isAvailable: !project }))
    .catch(err => error(err));
});