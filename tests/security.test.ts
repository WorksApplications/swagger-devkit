import * as devkit from '../src/index';
import * as yaml from 'js-yaml';

describe('Operation Object', () => {
  it('should add securitySchemes', () => {
    const swagger = new devkit.Swagger();

    const securityComponent = {
      BasicAuth: {
        type: 'http',
        scheme: 'basic',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer'
      },
      OAuth2: {
        type: 'oauth2',
        flow: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              read: 'Grants read access',
              write: 'Grants write access',
              admin: 'Grants access to admin operations',
            }
          }
        }
      }
    }


    swagger.addSecurityComponent(securityComponent)

    const expected  = {
      components: {
        schemas: {},
        securitySchemes: securityComponent,
      },
    };



    const actual: any = swagger.render();
    expect(actual).toEqual(expect.objectContaining(expected));
  });


  it('should add security', () => {
    const swagger = new devkit.Swagger();

    const security = [
      { Auth: [] as Array<string> },
      { OAuth2: ['read', 'write']},
    ];

    const expected = yaml.safeLoad(`
      paths:
        /pets:
          get:
            description: Returns all pets from the system that the user has access to
            security:
              - Auth: []
              - OAuth2: [read, write]
      `);

    

    swagger.addPath(
      '/pets',
      devkit.HttpMethod.GET,
      new devkit.Path({
        description: 'Returns all pets from the system that the user has access to',
        security: security,
      })
    );
    const actual: any = swagger.render();
    
    expect(actual).toEqual(expect.objectContaining(expected));
  });
});