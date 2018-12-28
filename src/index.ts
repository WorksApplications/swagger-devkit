import * as fs from 'fs';
import * as yaml from 'js-yaml';

function mapToObj<T>(arg: Map<string, T>, func: (arg0: T) => object = (x : any) => x): object {
  const obj: any = {};
  arg.forEach((value, key) => {
    obj[key] = func(value);
  });

  return obj;
};

export type SchemaInput = SchemaProps | Ref;

export enum SchemaType {
  INTEGER = <any>"integer",
  NUMBER = <any>"number",
  STRING = <any>"string",
  BOOLEAN = <any>"boolean",
  OBJECT = <any>"object",
  ARRAY = <any>"array",
}

export enum SchemaFormat {
  INT32 = <any>"int32",
  INT64 = <any>"int64",
  FLOAT = <any>"float",
  DOUBLE = <any>"double",
  BYTE = <any>"byte",
  BINARY = <any>"binary",
  DATE = <any>"date",
  DATETIME = <any>"datetime",
  PASSWORD = <any>"password",
}

export interface SchemaProps {
  type?: SchemaType | string,
  required?: Array<string>,
  properties?: {
    [key: string]: SchemaInput,
  },
  style?: string,
  items?: SchemaInput,
  format?: SchemaFormat | string,
  example?: any,
  enum?: Array<string>,
  description?: string,

  oneOf?: Array<SchemaInput>,
  allOf?: Array<SchemaInput>,
  anyOf?: Array<SchemaInput>,
  not?: SchemaInput,
  additionalProperties?: boolean,
  default?: any,
}

export class Schema {
  props: { "$ref": string } | SchemaProps;
  is_ref: boolean;

  constructor (props: SchemaInput) {
    if (props instanceof Ref) {
      this.props = { "$ref": props.ref };
      this.is_ref = true;
    } else {
      this.props = props;
      this.is_ref = false;
    }
  }

  static int32 (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.INTEGER,
      format: SchemaFormat.INT32,
      ...overrideProps,
    };
  }

  static int64 (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.INTEGER,
      format: SchemaFormat.INT64,
      ...overrideProps,
    };
  }

  static float (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.NUMBER,
      format: SchemaFormat.FLOAT,
      ...overrideProps,
    };
  }

  static double (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.NUMBER,
      format: SchemaFormat.DOUBLE,
      ...overrideProps,
    };
  }

  static string (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.STRING,
      ...overrideProps,
    };
  }

  static byte (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.STRING,
      format: SchemaFormat.BINARY,
      ...overrideProps,
    };
  }

  static boolean (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.BOOLEAN,
      ...overrideProps,
    };
  }

  static date (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.STRING,
      format: SchemaFormat.DATE,
      ...overrideProps,
    };
  }

  static datetime (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.STRING,
      format: SchemaFormat.DATETIME,
      ...overrideProps,
    };
  }

  static password (overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.STRING,
      format: SchemaFormat.PASSWORD,
      ...overrideProps,
    };
  }

  static array (items: SchemaInput, overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.ARRAY,
      items,
      ...overrideProps,
    };
  }

  static object (properties: { [key: string]: SchemaProps }, overrideProps?: Partial<SchemaProps>): SchemaProps {
    return {
      type: SchemaType.OBJECT,
      properties,
      ...overrideProps,
    };
  }

  render (): object {
    if (this.is_ref) {
      return this.props;
    } else {
      let object = this.props as SchemaProps;

      // Hmm, how to write properties transformation?

      return Object.assign(
        object,
        object.items && { items: new Schema(object.items).render() },
        object.oneOf && { oneOf: object.oneOf.map(schema => new Schema(schema).render()) },
        object.anyOf && { anyOf: object.anyOf.map(schema => new Schema(schema).render()) },
        object.allOf && { allOf: object.allOf.map(schema => new Schema(schema).render()) },
        object.not && { not: new Schema(object.not).render() },
      );
    }
  }
}

// Be careful! This SchemaInput is not converted to Schema in Header object in Response
export interface ResponseProps {
  description: string,
}

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
export type HeaderProps = Omit<ParameterProps, "name" | "in">;

export interface EncodingProps {
  contentType?: string,
  headers?: { [key: string]: HeaderProps },
  style?: string,
  explode?: boolean,
  allowReserved?: boolean,
}

export interface MediaTypeObject {
  schema?: SchemaInput,
  example?: any,
  examples?: { [key: string]: any },
  encoding?: { [key: string]: EncodingProps },
}

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

  addContent (contentType: string, schema: SchemaInput): Response {
    this.content.set(contentType, new Schema(schema));
    return this;
  }

  render (): object {
    return Object.assign(
      this.props,
      this.headers.size !== 0 && { headers: mapToObj(this.headers, h => Object.assign(h, { schema: new Schema(h.schema).render() })) },
      this.content.size !== 0 && { content: mapToObj(this.content, r => (Object.keys(r.render()).length > 0 ? { schema: r.render() } : {})) },
    )
  }
}

export enum ParameterLocation {
  PATH = <any>"path",
  HEADER = <any>"header",
  QUERY = <any>"query",
  COOKIE = <any>"cookie",
}

export enum ParameterStyle {
  MATRIX = <any>"matrix",
  LABEL = <any>"label",
  FORM = <any>"form",
  SIMPLE = <any>"simple",
  SPACEDELIMITED = <any>"spaceDelimited",
  PIPEDELIMITED = <any>"pipeDelimited",
  deepObject = <any>"deepObject",
}

export interface ParameterProps {
  name: string,
  in: ParameterLocation | string,
  description?: string,
  required?: boolean,
  deprecated?: boolean,
  allowEmptyValue?: boolean,

  style?: ParameterStyle | string,
  explode?: boolean,
  allowReserved?: boolean,
  schema?: SchemaInput,
  example?: any,
  examples?: { [key: string]: any },
}

export interface RequestBodyProps {
  description?: string,
  required?: boolean,
}

export class RequestBody {
  props: RequestBodyProps;
  content: Map<string, Schema> = new Map();

  constructor (props: RequestBodyProps = {}) {
    this.props = props;
  }

  addContent (contentType: string, schema: SchemaInput): RequestBody {
    this.content.set(contentType, new Schema(schema));
    return this;
  }

  render (): object {
    return Object.assign(
      this.props,
      this.content.size !== 0 && { content: mapToObj(this.content, r => ({ schema: r.render() })) },
    )
  }
}

export interface PathProps {
  summary?: string,
  operationId?: string,
  tags?: Array<string>,
  description?: string,
  security?: { [key: string]: Array<string> },
  parameters?: Array<ParameterProps>,
}

export class Path {
  props: PathProps;
  parameters: Array<ParameterProps> = [];
  responses: Map<string, Response> = new Map();
  requestBody: RequestBody;

  constructor (props: PathProps) {
    this.props = props;
  }

  addParameter (props: ParameterProps): Path {
    this.parameters.push(props);
    return this;
  }

  addResponse (statusCode: string, object: Response | ResponseProps): Path {
    if (object instanceof Response) {
      this.responses.set(statusCode, object);
    } else {
      this.responses.set(statusCode, new Response(object));
    }

    return this;
  }

  addResponses (responses: Array<{ statusCode: string, response: Response | ResponseProps }>): Path {
    return responses.reduce(
      (that, value) => {
        return that.addResponse(value.statusCode, value.response);
      },
      this,
    )
  }

  addRequestBody (requestBody: RequestBody): Path {
    this.requestBody = requestBody;
    return this;
  }

  render (): object {
    return Object.assign(
      this.props,
      this.requestBody && { requestBody: this.requestBody.render() },
      this.parameters.length != 0 && { parameters: this.parameters },
      this.responses.size != 0 && { responses: mapToObj(this.responses, r => r.render()) },
    );
  }
}

export class Ref {
  ref: string;

  constructor (ref: string) {
    this.ref = ref;
  }
}

export class Component extends Ref {
  schema: Schema;

  constructor (parent: Swagger, name: string, schema: SchemaInput) {
    super(`#/components/schemas/${name}`);

    parent.components.set(name, this);
    this.schema = new Schema(schema);
  }

  render (): object {
    return this.schema.render();
  }
}

export interface InfoProps {
  title: string,
  description?: string,
  termsOfService?: string,
  contact?: {
    name?: string,
    url: string,
    email: string,
  },
  license?: {
    name: string,
    url?: string
  },
  version: string,
}

export interface ServerVariableProps {
  enum?: Array<string>,
  default: string,
  description?: string,
}

export interface ServerProps {
  url: string,
  description?: string,
  variables?: { [key: string]: ServerVariableProps }
}

export enum HttpMethod {
  GET = <any>"get",
  PUT = <any>"put",
  POST = <any>"post",
  DELETE = <any>"delete",
  OPTIONS = <any>"options",
  HEAD = <any>"head",
  PATCH = <any>"patch",
  TRACE = <any>"trace",
}

export interface SwaggerRepr {
  paths: Map<string, Map<HttpMethod, Path>>,
  components: Map<string, Component>,
}

export class Plugin {
  addPathOptions (path: string, method: HttpMethod, options: object) {}
  run (iohandler: (filename: string, content: string) => void, swagger: SwaggerRepr) {}
}

export interface SwaggerOptions {
  openapi?: string,
  outfile?: string,
  plugins?: { [pluginName: string]: Plugin },
}

export class Swagger {
  outfile: string = 'openapi.yml';
  object: any = {};
  paths: Map<string, Map<HttpMethod, Path>> = new Map();
  components: Map<string, Component> = new Map();
  plugins: { [pluginName: string]: Plugin } = {};

  constructor (options?: SwaggerOptions) {
    if (options && options.openapi) {
      this.addObject('openapi', options.openapi);
    } else {
      this.addObject('openapi', '3.0.0');
    }

    this.addObject('paths', {});

    if (options && options.plugins) {
      this.plugins = options.plugins;
    }

    if (options && options.outfile) {
      this.outfile = options.outfile;
    }
  }

  private addObject (key: string, value: any) {
    this.object[key] = value;
  }

  addInfo(props: InfoProps) {
    this.addObject('info', props);
  }

  addServers(props: Array<ServerProps>) {
    this.addObject('servers', props);
  }

  addPath(path: string, method: HttpMethod, object: Path, pluginOptions?: { [pluginName: string]: object }) {
    if (!this.paths.has(path)) {
      this.paths.set(path, new Map());
    }

    this.paths.get(path).set(method, object);
    
    if (pluginOptions) {
      Object.keys(pluginOptions).forEach((name) => {
        this.plugins[name].addPathOptions(path, method, pluginOptions[name]);
      });
    }
  }

  render (): object {
    let pathObject: any = {};
    this.paths.forEach((methods, path) => {
      pathObject[path] = {};

      methods.forEach((object, method) => {
        pathObject[path][method] = object.render();
      });
    });
    this.object['paths'] = pathObject;

    return Object.assign(
      this.object,
      {
        paths: pathObject,
        components: {
          schemas: mapToObj(this.components, r => r.render())
        },
      }
    );
  }

  run (options?: { dry: boolean }) {
    const iohandler =
      options && options.dry ? (filename: string, content: string) => {
        console.log(`=== output to '${filename}' ===`);
        console.log(content);
      } : (filename: string, content: string) => {
        fs.writeFileSync(filename, content);
      };

    iohandler(this.outfile, yaml.safeDump(this.render(), {
      noRefs: true,
    }));

    Object.keys(this.plugins).forEach(pluginName => {
      this.plugins[pluginName].run(iohandler, {
        paths: this.paths,
        components: this.components,
      });
    });
  }
}
