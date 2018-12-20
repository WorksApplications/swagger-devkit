import * as fs from 'fs';
import * as yaml from 'js-yaml';

export class Swagger {
  outfile: string = 'openapi.yml';

  constructor () {
  }

  run () {
    fs.writeFileSync(this.outfile, yaml.dump({
      'openapi': '3.0.0',
    }));
  }
}
