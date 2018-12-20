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

export class Ref {
  ref: string;

  constructor (ref: string) {
    this.ref = ref;
  }
}

export interface SchemaProps {
  type: string,
  required?: Array<string>,
  properties?: {
    [key: string]: SchemaProps | Schema,
  },
  items?: SchemaProps | Schema,
  format?: string,
}

export class Schema {
  props: object;

  constructor (props: Ref | SchemaProps) {
    if (props instanceof Ref) {
      this.props = { "$ref": props.ref };
    } else {
      this.props = props;
    }
  }

  render (): object {
    return this.props;
  }
}

export interface ParameterProps {
  name: string,
  in: string,
  description: string,
  required: boolean,
  schema: Schema,
}

export interface PathProps {
  summary: string,
  operationId: string,
  tags: Array<string>,
}

export interface HeaderProps {
  description: string,
  schema: Schema,
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
  content: Map<string, Schema> = new Map();

  constructor (props: ResponseProps) {
    this.props = props;
  }

  addHeader (header: string, props: HeaderProps): Response {
    this.headers.set(header, props);
    return this;
  }

  addContent (contentType: string, schema: Ref | SchemaProps): Response {
    this.content.set(contentType, new Schema(schema));
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

export class Component extends Ref {
  schema: Schema;

  constructor (parent: Swagger, name: string, schema: Ref | SchemaProps) {
    super(`#/components/schemas/${name}`);

    parent.components.set(name, this);
    this.schema = new Schema(schema);
  }

  render (): object {
    return this.schema.render();
  }
}

export class Swagger {
  outfile: string = 'openapi.yml';
  object: any = {};
  paths: Map<string, Map<HttpMethod, Path>> = new Map();
  components: Map<string, Component> = new Map();

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

    fs.writeFileSync(this.outfile, yaml.dump(Object.assign(
      this.object,
      {
        paths: pathObject,
        components: mapToObj(this.components, r => r.render()),
      }
    )));
  }
}
