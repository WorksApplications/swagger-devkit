import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface InfoProps {
  title: string,
  description?: string,
  version?: string,
}

export interface ServersProps {
  url: string,
}

export enum HttpMethod {
  POST = <any>"post",
  GET = <any>"get",
  PUT = <any>"put",
  DELETE = <any>"delete",
  PATCH = <any>"patch",
  OPTIONS = <any>"options",
}

type SchemaProps = {
  type: string,
  items: SchemaProps,
} | {
  type: string,
  properties: Map<string, SchemaProps>,
} | {
  "$ref": string,
} | {
  type: string,
  format?: string,
};

export interface ParameterProps {
  name: string,
  in: string,
  description: string,
  required: boolean,
  schema: SchemaProps,
}

export interface PathProps {
  summary: string,
  operationId: string,
  tags: Array<string>,
}

export interface HeaderProps {
  description: string,
  schema: SchemaProps,
}

export interface ResponseProps {
  description: string,
}

function mapToObj<T>(arg: Map<string, T>, func: (arg0: T) => object = (x : any) => x): object {
  const obj: any = {};
  arg.forEach((value, key) => {
    obj[key] = func(value);
  });

  return obj;
};

export class Response {
  props: ResponseProps;
  headers: Map<string, HeaderProps> = new Map();
  content: Map<string, SchemaProps> = new Map();

  constructor (props: ResponseProps) {
    this.props = props;
  }

  addHeader (header: string, props: HeaderProps): Response {
    this.headers.set(header, props);
    return this;
  }

  addContent (contentType: string, schema: SchemaProps): Response {
    this.content.set(contentType, schema);
    return this;
  }

  render (): object {
    return Object.assign(
      this.props,
      {
        headers: mapToObj(this.headers),
        content: mapToObj(this.content),
      }
    )
  }
}

export class Path {
  props: PathProps;
  parameters: Array<ParameterProps> = [];
  responses: Map<string, Response> = new Map();

  constructor (props: PathProps) {
    this.props = props;
  }

  addParameter (props: ParameterProps): Path {
    this.parameters.push(props);
    return this;
  }

  addResponse (statusCode: string, object: Response): Path {
    this.responses.set(statusCode, object);
    return this;
  }

  render (): object {
    return Object.assign(
      this.props,
      {
        parameters: this.parameters,
        responses: mapToObj(this.responses, r => r.render()),
      }
    );
  }
}

export class Swagger {
  outfile: string = 'openapi.yml';
  object: any = {};
  paths: Map<string, Map<HttpMethod, Path>> = new Map();

  constructor (openapi: string = '3.0.0') {
    this.addObject('openapi', openapi);
    this.addObject('paths', {});
  }

  private addObject (key: string, value: any) {
    this.object[key] = value;
  }

  addInfo(props: InfoProps) {
    this.addObject('info', props);
  }

  addServers(props: ServersProps) {
    this.addObject('servers', props);
  }

  addPath(path: string, method: HttpMethod, object: Path) {
    if (!this.paths.has(path)) {
      this.paths.set(path, new Map());
    }

    this.paths.get(path).set(method, object);
  }

  run () {
    let pathObject: any = {};
    this.paths.forEach((methods, path) => {
      pathObject[path] = {};

      methods.forEach((object, method) => {
        pathObject[path][method] = object.render();
      });
    });
    this.object['paths'] = pathObject;

    fs.writeFileSync(this.outfile, yaml.dump(this.object));
  }
}
