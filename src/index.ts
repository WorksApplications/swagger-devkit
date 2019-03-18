import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as commandpost from 'commandpost';
import * as express from 'express';

/**
 * @private
 */
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

// The recursive element SchemaInput should be abstracted as type parameter
// and is instantiated into Schema class properly?
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

/**
 * @class Schema class
 */
export class Schema {
  private props: { "$ref": string } | SchemaProps;
  private refObject: Ref;
  private is_ref: boolean;

  constructor (props: SchemaInput) {
    if (props instanceof Ref) {
      this.props = { "$ref": props.ref };
      this.refObject = props;
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

  example (): any {
    if ((this.props as any).example) {
      return (this.props as any).example;
    } else if (this.is_ref) {
      return this.refObject.example();
    } else {
      const props = this.props as SchemaProps;

      if (props.type === SchemaType.BOOLEAN) {
        return true;
      } else if (props.type === SchemaType.INTEGER) {
        return 0;
      } else if (props.type === SchemaType.STRING) {
        return "";
      } else if (props.type === SchemaType.ARRAY) {
        return [ new Schema(props.items).example() ];
      } else {
        return Object.keys(props.properties).reduce((prev, current) => Object.assign(prev, { [current]: new Schema(props.properties[current]).example() }), {})
      }
    }
  }

  render (): object {
    if (this.is_ref) {
      return this.props;
    } else {
      let object = this.props as SchemaProps;

      return Object.assign(
        object,
        object.items && { items: new Schema(object.items).render() },
        object.properties && { properties: Object.keys(object.properties)
          .reduce((prev, current) => Object.assign(prev, { [current]: new Schema(object.properties[current]).render() }), {}) },
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

/** @private */
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

/** @private */
type HeaderProps = Omit<ParameterProps, "name" | "in">;

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
  private props: ResponseProps;
  private headers: Map<string, HeaderProps> = new Map();
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
  private props: RequestBodyProps;
  private content: Map<string, Schema> = new Map();

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
  security?: Array<{[key: string]: Array<string>}>,
  parameters?: Array<ParameterProps>,
}

export class Path {
  private props: PathProps;
  private parameters: Array<ParameterProps> = [];
  responses: Map<string, Response> = new Map();
  private requestBody: RequestBody;

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

/**
 * @class Represents a reference path for `$ref` field
 */
export class Ref {
  /** e.g.) `#/components/schemas/name` */
  ref: string;

  constructor (ref: string) {
    this.ref = ref;
  }

  example (): any {
    throw new Error('not implemented yet');
  }
}



/**
 * @class Instantiating this class adds the component immediately.
 */
export class Component extends Ref {
  private schema: Schema;

  /**
   * 
   * @param parent Swagger instance to which the component to be added
   * @param name Name of the component, should be unique in a swagger object
   * @param schema Schema of the component
   */
  constructor (parent: Swagger, name: string, schema: SchemaInput) {
    super(`#/components/schemas/${name}`);

    parent.addComponent(name, this);
    this.schema = new Schema(schema);
  }

  render (): object {
    return this.schema.render();
  }

  example (): any {
    return this.schema.example();
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




/**
 * @interface Options for Swagger class.
 */
export interface SwaggerOptions {
  /** Version of OpenAPI (default is `3.0.0` and only OpenAPI3 is supported) */
  openapi?: string,
  /** Specifies the filename for output */
  outfile?: string,
  /** Install external plugins */
  plugins?: { [pluginName: string]: Plugin },
}

/**
 * @class The core class of swagger-devkit. See `SwaggerOptions` for constructor options.
 */
export class Swagger {
  private outfile: string = 'openapi.yml';
  private object: any = {};
  private paths: Map<string, Map<HttpMethod, Path>> = new Map();
  private components: Map<string, Component> = new Map();
  private plugins: { [pluginName: string]: Plugin } = {};
  private securityComponent : object;

  private command = commandpost
    .create<{ mockServer: boolean, dryRun: boolean }, {}>("swagger-devkit")
    .version(require('../package.json').version, '-v, --version')
    .option('-s, --mock-server', 'Start the mock server')
    .option('--dry-run', 'Dry-run; not actually run the command but show the result')
    .action((opts, args) => {
      this.evaluate(opts);
    });

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

  /**
   * Adds a component to `components` section
   */
  addComponent(name: string, component: Component) {
    if (this.components.get(name) !== undefined) {
      throw new Error(`DuplicateComponentKeyException: ${name} is already defined`);
    }
    this.components.set(name, component);
  }

  /**
   * 
   * @param object securitySchemes
   */
  addSecurityComponent(object: object) {
    this.securityComponent = object;
  }


  /**
   * Adds `info` section
   */
  addInfo(props: InfoProps) {
    this.addObject('info', props);
  }

  /**
   * Adds `servers` section
   */
  addServers(props: Array<ServerProps>) {
    this.addObject('servers', props);
  }

  /**
   * Adds a new path for `paths` section
   * @param path URI for the path
   * @param method HTTP method for the path
   * @param object The path object
   * @param pluginOptions List options with each external plugin name
   */
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

  /**
   * Generates an object that represents the swagger structure
   */
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
          schemas: mapToObj(this.components, r => r.render()),
          securitySchemes: this.securityComponent,
        },
      }
    );
  }

  /**
   * Generates a yaml file
   */
  generate (options?: { dry: boolean }) {
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

  /**
   * Start a mock server.
   * The server will respond with some value in `example` section in your path object.
   * 
   * @param options.interactionUrl Default is `/interactions`
   * @param options.port Default is 3000
   */
  startMockServer (options?: { interactionUrl?: string, port?: number }) {
    if (!options) options = {};
    if (!options.interactionUrl) options.interactionUrl = '/interactions';
    if (!options.port) options.port = 3000;

    const app = express();

    this.paths.forEach((m, url) => {
      m.forEach((pathObject, method) => {
        (app as any)[method](url, (req: express.Request, res: express.Response) => {
          const statusCode = pathObject.responses.keys().next().value;
          const responseBody = pathObject.responses.get(statusCode).content.get('application/json').example();

          res.status(parseInt(statusCode, 10)).json(responseBody);
        })
      })
    });

    app.listen(options.port, () => {
      console.log(`listening to http://localhost:${options.port}...`);
    });
  }

  /**
   * Evaluates options and arguments
   * @param options Commandline options for cli
   */
  evaluate (options?: { mockServer: boolean, dryRun: boolean }) {
    if (options.mockServer) {
      this.startMockServer();
    } else {
      this.generate({ dry: options.dryRun });
    }
  }

  /**
   * Runs the swagger-devkit cli
   */
  run (options?: { dry: boolean }) {
    commandpost
      .exec(this.command, process.argv)
      .catch(err => {
        if (err instanceof Error) {
          console.error(err.stack);
        } else {
          console.error(err);
        }

        process.exit(1);
      });
  }
}
