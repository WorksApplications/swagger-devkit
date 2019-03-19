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

  it('should add securitySchemes class', () => {
    const swagger = new devkit.Swagger();
    swagger.addSecurityComponent(new devkit.SecuritySchemes()
      .addBasic('basic')
      .addBearer()
      .addApiKey('header', 'X-API-Key')
      .addOpenID('https://example.com/.well-known/openid-configuration')
      .addOAuth2({
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            read: 'Grants read access',
            write: 'Grants write access',
            admin: 'Grants access to admin operations',
          }
        }
      })
    )

    const expected = yaml.safeLoad(`
    components:
      schemas: {}
      securitySchemes:
        BasicAuth:
          type: http
          scheme: basic
        BearerAuth:
          type: http
          scheme: bearer
        ApiKeyAuth:
          type: apiKey
          in: header
          name: X-API-Key
        OpenID:
          type: openIdConnect
          openIdConnectUrl: https://example.com/.well-known/openid-configuration
        OAuth2:
          type: oauth2
          flows:
            authorizationCode:
              authorizationUrl: https://example.com/oauth/authorize
              tokenUrl: https://example.com/oauth/token
              scopes:
                read: Grants read access
                write: Grants write access
                admin: Grants access to admin operations`);

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