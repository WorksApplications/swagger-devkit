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

    it('key is already defined', () => {
      const swagger = new devkit.Swagger();

      new devkit.Component(swagger, 'GeneralError', devkit.Schema.object({
        code: devkit.Schema.int32(),
        message: devkit.Schema.string(),
      }))
      
      expect( ()=>{
        new devkit.Component(swagger, 'GeneralError', devkit.Schema.object({
          id: devkit.Schema.int64(),
          name: devkit.Schema.string(),
        }))
      }).toThrow('DuplicateComponentKeyException');
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

    it('should add paths object with parameter', () => {
      const swagger = new devkit.Swagger();

      const expected = yaml.safeLoad(`
      paths:
        /pets:
          get:
            description: Returns pets based on ID
            summary: Find pets by ID
            operationId: getPetsById
            parameters:
            - name: id
              in: path
              description: ID of pet to use
              required: true
              schema:
                type: array
                style: simple
                items:
                  type: string  
            responses:
              '200':
                description: pet response
                content:
                  '*/*' :
                    schema:
                      type: array
                      items:
                        $ref: '#/components/schemas/Pet'
              default:
                description: error payload
                content:
                  'text/html':
                    schema:
                      $ref: '#/components/schemas/ErrorModel'
      `);

      swagger.addPath(
        '/pets',
        devkit.HttpMethod.GET,
        new devkit.Path({
          description: 'Returns pets based on ID',
          summary: 'Find pets by ID',
          operationId: 'getPetsById',
        })
        .addParameter({
          name: 'id',
          in: 'path',
          description: 'ID of pet to use',
          required: true,
          schema: devkit.Schema.array(devkit.Schema.string(), {
            style: 'simple'
          })
        })
        .addResponse('200',
          new devkit.Response({
            description: 'pet response'
          })
          .addContent('*/*', devkit.Schema.array(new devkit.Ref('#/components/schemas/Pet')))
        )
        .addResponse('default',
          new devkit.Response({
            description: 'error payload'
          })
          .addContent('text/html', new devkit.Ref('#/components/schemas/ErrorModel'))
        )
      );
  
      const actual: any = swagger.render();
  
      expect(actual).toEqual(expect.objectContaining(expected));
    });
  });

  describe('Operation Object', () => {
    it('should add paths object with requestBody and responses', () => {
      const swagger = new devkit.Swagger();

      const expected = yaml.safeLoad(`
      paths:
        /pets/{petId}:
          put:
            tags:
            - pet
            summary: Updates a pet in the store with form data
            operationId: updatePetWithForm
            parameters:
            - name: petId
              in: path
              description: ID of pet that needs to be updated
              required: true
              schema:
                type: string
            requestBody:
              content:
                'application/x-www-form-urlencoded':
                  schema:
                    properties:
                      name: 
                        description: Updated name of the pet
                        type: string
                      status:
                        description: Updated status of the pet
                        type: string
                    required:
                      - status
            responses:
              '200':
                description: Pet updated.
                content: 
                  'application/json': {}
                  'application/xml': {}
              '405':
                description: Method Not Allowed
                content: 
                  'application/json': {}
                  'application/xml': {}
            security:
              petstore_auth:
              - write:pets
              - read:pets`);

      swagger.addPath(
        '/pets/{petId}',
        devkit.HttpMethod.PUT,
        new devkit.Path({
          tags: [ 'pet' ],
          summary: 'Updates a pet in the store with form data',
          operationId: 'updatePetWithForm',
          security: {
            petstore_auth: [
              'write:pets',
              'read:pets',
            ]
          }
        })
        .addParameter({
          name: 'petId',
          in: 'path',
          description: 'ID of pet that needs to be updated',
          required: true,
          schema: devkit.Schema.string(),
        })
        .addRequestBody(
          new devkit.RequestBody().addContent('application/x-www-form-urlencoded', {
            properties: {
              name: devkit.Schema.string({ description: 'Updated name of the pet' }),
              status: devkit.Schema.string({ description: 'Updated status of the pet' }),
            },
            required: [ 'status' ]
          })
        )
        .addResponse('200',
          new devkit.Response({
            description: 'Pet updated.'
          })
          .addContent('application/json', {})
          .addContent('application/xml', {})
        )
        .addResponse('405',
          new devkit.Response({
            description: 'Method Not Allowed'
          })
          .addContent('application/json', {})
          .addContent('application/xml', {})
        )
      );
  
      const actual: any = swagger.render();
  
      expect(actual).toEqual(expect.objectContaining(expected));
    });
  });

  
});

