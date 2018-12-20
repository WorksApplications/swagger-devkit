const swagger = require('../dist');

const api = new swagger.Swagger();

api.addInfo({
  title: 'Swagger Petstore',
  version: '1.0.0',
});

api.addServers([
  {
    url: 'http://petstore.swagger.io/v1',
  }
]);

const pets = '/pets';

api.addPath(
  pets,
  swagger.HttpMethod.GET,
  new swagger.Path({
    summary: 'List all pets',
    operationId: 'listPets',
    tags: [
      'pets',
    ],
  })
  .addParameter({
    name: 'limit',
    in: 'query',
    description: 'How many items to return at one time (max 100)',
    required: false,
    schema: {
      type: 'integer',
      format: 'int32',
    },
  })
  .addResponse(
    '200',
    new swagger.Response({
      description: 'A paged array of pets'
    })
    .addHeader('x-next', {
      description: 'A link to the next page of responses',
      schema: {
        "$ref": '#/components/schemas/Pets',
      }
    })
    .addContent('application/json', {
      "$ref": '#/components/schemas/Error',
    })
  )
  .addResponse(
    'default',
    new swagger.Response({
      description: 'unexpected error',
    })
    .addContent('application/json', {
      "$ref": '#/components/schemas/Error',
    })
  )
);

api.addPath(
  pets,
  swagger.HttpMethod.POST,
  new swagger.Path({
    summary: 'Create a pet',
    operationId: 'createPets',
    tags: [ 'pets' ],
  })
  .addResponse(
    '201',
    new swagger.Response({
      description: 'Null response'
    })
  )
  .addResponse(
    'default',
    new swagger.Response({
      description: 'unexpected error',
    })
    .addContent('application/json', {
      "$ref": '#/components/schemas/Error',
    })
  )
)

api.addPath(
  `${pets}/{petId}`,
  swagger.HttpMethod.GET,
  new swagger.Path({
    summary: 'Info for a specific pet',
    operationId: 'showPetById',
    tags: [ 'pets' ],
  })
  .addParameter({
    name: 'petId',
    in: 'path',
    required: true,
    description: 'The id of the pet to retrieve',
    schema: {
      type: 'string',
    }
  })
  .addResponse(
    '200',
    new swagger.Response({
      description: 'Expected response to a valid request',
    })
    .addContent('application/json', {
      "$ref": '#/components/schemas/Pets',
    })
  )
  .addResponse(
    'default',
    new swagger.Response({
      description: 'unexpected error',
    })
    .addContent('application/json', {
      "$ref": '#/components/schemas/Error',
    })
  )
);

api.run();
