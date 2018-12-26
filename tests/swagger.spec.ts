import * as devkit from '../src/index';
import * as yaml from 'js-yaml';

describe('Swagger', () => {
  describe('Info Object', () => {
    it('should add info', () => {
      const swagger = new devkit.Swagger();

      const expected = yaml.safeLoad(`
      info:
        title: Sample Pet Store App
        description: This is a sample server for a pet store.
        termsOfService: http://example.com/terms/
        contact:
          name: API Support
          url: http://www.example.com/support
          email: support@example.com
        license:
          name: Apache 2.0
          url: https://www.apache.org/licenses/LICENSE-2.0.html
        version: 1.0.1
      `);
  
      swagger.addInfo({
        title: 'Sample Pet Store App',
        description: 'This is a sample server for a pet store.',
        termsOfService: 'http://example.com/terms/',
        contact: {
          name: 'API Support',
          url: 'http://www.example.com/support',
          email: 'support@example.com',
        },
        license: {
          name: 'Apache 2.0',
          url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
        },
        version: '1.0.1'
      });
  
      const actual: any = swagger.render();
  
      expect(actual).toEqual(expect.objectContaining(expected));
    });
  });

  describe('Servers Object', () => {
    it('should add servers object', () => {
      const swagger = new devkit.Swagger();

      const expected = yaml.safeLoad(`
      servers:
        - url: https://development.gigantic-server.com/v1
          description: Development server
        - url: https://staging.gigantic-server.com/v1
          description: Staging server
        - url: https://api.gigantic-server.com/v1
          description: Production server
      `);

      swagger.addServers([
        { url: 'https://development.gigantic-server.com/v1', description: 'Development server' },
        { url: 'https://staging.gigantic-server.com/v1', description: 'Staging server' },
        { url: 'https://api.gigantic-server.com/v1', description: 'Production server' },
      ]);

      const actual: any = swagger.render();

      expect(actual).toEqual(expect.objectContaining(expected));
    });

    it('should add servers object with variables', () => {
      const swagger = new devkit.Swagger();

      const expected = yaml.safeLoad(`
      servers:
      - url: https://{username}.gigantic-server.com:{port}/{basePath}
        description: The production API server
        variables:
          username:
            # note! no enum here means it is an open value
            default: demo
            description: this value is assigned by the service provider, in this example \`gigantic-server.com\`
          port:
            enum:
              - '8443'
              - '443'
            default: '8443'
          basePath:
            # open meaning there is the opportunity to use special base paths as assigned by the provider, default is \`v2\`
            default: v2
      `);

      swagger.addServers([
        {
          url: 'https://{username}.gigantic-server.com:{port}/{basePath}',
          description: 'The production API server',
          variables: {
            username: {
              default: 'demo',
              description: 'this value is assigned by the service provider, in this example `gigantic-server.com`',
            },
            port: {
              enum: [
                '8443',
                '443'
              ],
              default: '8443'
            },
            basePath: {
              default: 'v2'
            }
          }
        }
      ]);

      const actual: any = swagger.render();

      expect(actual).toEqual(expect.objectContaining(expected));
    });
  });

  describe('Components Object', () => {
    it('should define schemas', () => {
      const swagger = new devkit.Swagger();

      const expected = yaml.safeLoad(`
      components:
        schemas:
          GeneralError:
            type: object
            properties:
              code:
                type: integer
                format: int32
              message:
                type: string
          Category:
            type: object
            properties:
              id:
                type: integer
                format: int64
              name:
                type: string
          Tag:
            type: object
            properties:
              id:
                type: integer
                format: int64
              name:
                type: string
      `);

      new devkit.Component(swagger, 'GeneralError', devkit.Schema.object({
        code: devkit.Schema.int32(),
        message: devkit.Schema.string(),
      }))
      new devkit.Component(swagger, 'Category', devkit.Schema.object({
        id: devkit.Schema.int64(),
        name: devkit.Schema.string(),
      }))
      new devkit.Component(swagger, 'Tag', devkit.Schema.object({
        id: devkit.Schema.int64(),
        name: devkit.Schema.string(),
      }))
  
      const actual: any = swagger.render();
  
      expect(actual).toEqual(expect.objectContaining(expected));
    });
  });

  describe('Paths Object', () => {
    it('should add paths object', () => {
      const swagger = new devkit.Swagger();

      const expected = yaml.safeLoad(`
      paths:
        /pets:
          get:
            description: Returns all pets from the system that the user has access to
            responses:
              '200':
                description: A list of pets.
                content:
                  application/json:
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/pet'
      `);

      swagger.addPath(
        '/pets',
        devkit.HttpMethod.GET,
        new devkit.Path({
          description: 'Returns all pets from the system that the user has access to',
        })
        .addResponse('200',
          new devkit.Response({
            description: 'A list of pets.'
          })
          .addContent('application/json', devkit.Schema.array(new devkit.Ref('#/components/schemas/pet')))
        )
      );
  
      const actual: any = swagger.render();
  
      expect(actual).toEqual(expect.objectContaining(expected));
    });
  });
});

