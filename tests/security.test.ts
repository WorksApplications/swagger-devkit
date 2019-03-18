import * as devkit from '../src/index';

describe('Operation Object', () => {
  it('should add paths object with requestBody and responses', () => {
    const swagger = new devkit.Swagger();

    swagger.addSecurityComponent({
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
    })

    const expected  = {
      components: {
        schemas: {},
        securitySchemes: {
          BasicAuth: {
            type: 'http',
            scheme: 'basic'
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
                  admin: 'Grants access to admin operations'
                }
              }
            }
          }
        }
      }
    };



    const actual: any = swagger.render();
    expect(actual).toEqual(expect.objectContaining(expected));
  });
});