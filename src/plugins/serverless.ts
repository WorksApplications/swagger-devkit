import * as devkit from '../index';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

export interface ServerlessOptions {
  filepath: string,
  aggregateByFunctionName?: boolean,
}

export class ServerlessPlugin extends devkit.Plugin {
  options: ServerlessOptions;
  pathOptions: Map<string, object> = new Map();

  constructor (options: ServerlessOptions) {
    super();

    this.options = options;
  }

  static generatePathKey(path: string, method: devkit.HttpMethod): string {
    return `${path}#${method}`;
  }

  addPathOptions (path: string, method: devkit.HttpMethod, options: object) {
    this.pathOptions.set(ServerlessPlugin.generatePathKey(path, method), options);
  }

  run (iohandler: (filename: string, content: string) => void, swagger: devkit.SwaggerRepr) {
    let object: any = {};

    swagger.paths.forEach((pathMap, url) => {
      pathMap.forEach((path, method) => {
        const pathOptions: any = this.pathOptions.get(ServerlessPlugin.generatePathKey(url,method));

        if (this.options.aggregateByFunctionName && (!pathOptions || !pathOptions['functionName'])) {
          throw new Error(`Specify 'functionName' under aggregateByFunctionName mode for the path: ${method} ${url}`);
        }

        const name = this.options.aggregateByFunctionName
          ? pathOptions['functionName']
          : `${url.split('{').join('_').split('}').join('_').split('/').join('')}_${method}`;

        if (!object[name]) {
          object[name] = { events: [] };
        }

        object[name]['events'].push({
          http: Object.assign({
            path: url,
            method: method,
          }, pathOptions['apigateway'])
        });
      });
    });

    iohandler(this.options.filepath, yaml.safeDump(object));
  }
}
