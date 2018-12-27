import * as devkit from '../index';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

export interface ServerlessOptions {
  filepath: string,
}

export class ServerlessPlugin extends devkit.Plugin {
  options: ServerlessOptions;
  pathOptions: Map<string, object> = new Map();

  constructor (options: ServerlessOptions) {
    super();

    this.options = options;
  }

  addPathOptions (path: string, method: devkit.HttpMethod, options: object) {
    this.pathOptions.set(`${path}#${method}`, options);
  }

  run (swagger: devkit.SwaggerRepr) {
    let object: any = {};

    swagger.paths.forEach((pathMap, url) => {
      pathMap.forEach((path, method) => {
        const name = `${url.split('{').join('_').split('}').join('_').split('/').join('')}_${method}`;

        object[name] = {
          events: [
            {
              http: Object.assign({
                path: url,
                method: method,
              }, this.pathOptions.get(`${url}#${method}`))
            }
          ]
        };
      });
    });

    fs.writeFileSync(this.options.filepath, yaml.safeDump(object));
  }
}
