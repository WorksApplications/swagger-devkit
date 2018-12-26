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

  it('should add servers', () => {
    const swagger = new devkit.Swagger();

    const serversProps: Array<devkit.ServerProps> = [
      {
        url: 'http://serverA.com',
        description: 'serverA',
      },
      {
        url: 'http://serverB.com',
        description: 'serverB',
      },
    ];

    swagger.addServers(serversProps);

    const actual: any = swagger.render();

    expect(actual['servers']).toBe(serversProps);
  });
});

