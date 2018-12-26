import * as devkit from '../src/index';
import * as yaml from 'js-yaml';

const petstoreYaml = `
openapi: "3.0.0"
info:
  version: 1.0.0
  title: Swagger Petstore
  license:
    name: MIT
servers:
  - url: http://petstore.swagger.io/v1
paths:
  /pets:
    get:
      summary: List all pets
      operationId: listPets
      tags:
        - pets
      parameters:
        - name: limit
          in: query
          description: How many items to return at one time (max 100)
          required: false
          schema:
            type: integer
            format: int32
      responses:
        '200':
          description: A paged array of pets
          headers:
            x-next:
              description: A link to the next page of responses
              schema:
                type: string
          content:
            application/json:    
              schema:
                $ref: "#/components/schemas/Pets"
        default:
          description: unexpected error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
    post:
      summary: Create a pet
      operationId: createPets
      tags:
        - pets
      responses:
        '201':
          description: Null response
        default:
          description: unexpected error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
  /pets/{petId}:
    get:
      summary: Info for a specific pet
      operationId: showPetById
      tags:
        - pets
      parameters:
        - name: petId
          in: path
          required: true
          description: The id of the pet to retrieve
          schema:
            type: string
      responses:
        '200':
          description: Expected response to a valid request
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pets"
        default:
          description: unexpected error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
components:
  schemas:
    Pet:
      required:
        - id
        - name
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        tag:
          type: string
    Pets:
      type: array
      items:
        $ref: "#/components/schemas/Pet"
    Error:
      required:
        - code
        - message
      properties:
        code:
          type: integer
          format: int32
        message:
          type: string`;

test('test petstore.yml', () => {
  const swagger = new devkit.Swagger();

  swagger.addInfo({
    version: '1.0.0',
    title: 'Swagger Petstore',
    license: { name: 'MIT' },
  });
  swagger.addServers([
    { url: 'http://petstore.swagger.io/v1' },
  ]);

  const petObject = new devkit.Component(swagger, 'Pet', {
    required: [ 'id', 'name' ],
    properties: {
      id: devkit.Schema.int64(),
      name: devkit.Schema.string(),
      tag: devkit.Schema.string()
    }
  });
  const petsObject = new devkit.Component(swagger, 'Pets', devkit.Schema.array(petObject));
  const errorObject = new devkit.Component(swagger, 'Error', {
    required: [ 'code', 'message' ],
    properties: {
      code: devkit.Schema.int32(),
      message: devkit.Schema.string(),
    }
  });

  const defaultResponse = new devkit.Response({
    description: 'unexpected error',
  }).addContent('application/json', errorObject);

  swagger.addPath(
    '/pets',
    devkit.HttpMethod.GET,
    new devkit.Path({
      summary: 'List all pets',
      operationId: 'listPets',
      tags: [
        'pets'
      ],
    })
    .addParameter({
      name: 'limit',
      in: 'query',
      description: 'How many items to return at one time (max 100)',
      required: false,
      schema: devkit.Schema.int32(),
    })
    .addResponse(
      '200',
      new devkit.Response({
        description: 'A paged array of pets',
      })
      .addHeader('x-next', {
        description: 'A link to the next page of responses',
        schema: devkit.Schema.string(),
      })
      .addContent('application/json', petsObject),
    )
    .addResponse('default', defaultResponse)
  );

  swagger.addPath(
    '/pets',
    devkit.HttpMethod.POST,
    new devkit.Path({
      summary: 'Create a pet',
      operationId: 'createPets',
      tags: [ 'pets' ],
    })
    .addResponse('201', { description: 'Null response' })
    .addResponse('default', defaultResponse)
  );

  swagger.addPath(
    '/pets/{petId}',
    devkit.HttpMethod.GET,
    new devkit.Path({
      summary: 'Info for a specific pet',
      operationId: 'showPetById',
      tags: [ 'pets' ]
    })
    .addParameter({
      name: 'petId',
      in: 'path',
      required: true,
      description: 'The id of the pet to retrieve',
      schema: devkit.Schema.string(),
    })
    .addResponse('200',
      new devkit.Response({
        description: 'Expected response to a valid request',
      })
      .addContent('application/json', petsObject)
    )
    .addResponse('default', defaultResponse)
  );

  expect(swagger.render()).toEqual(yaml.safeLoad(petstoreYaml));
});
