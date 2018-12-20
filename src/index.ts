import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface InfoProps {
  title: string,
  description?: string,
  version?: string,
};

export class Info {
  constructor (parent: Swagger, props: InfoProps) {
    parent._addObject('info', props);
  }
}

export interface ServersProps {
  url: string,
}

export class Servers {
  constructor (parent: Swagger, props: Array<ServersProps>) {
    parent._addObject('servers', props);
  }
}

export class Swagger {
  outfile: string = 'openapi.yml';
  object: any = {};

  constructor (openapi?: string) {
    this._addObject('openapi', '3.0.0');
  }

  _addObject (key: string, value: any) {
    this.object[key] = value;
  }

  run () {
    fs.writeFileSync(this.outfile, yaml.dump(this.object));
  }
}
