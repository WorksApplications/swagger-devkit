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

api.addPath(
  '/pets',
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
        _ref: '#/components/schemas/Pets',
      }
    })
    .addContent('application/json', {
      _ref: '#/components/schemas/Error',
    })
  )
);

api.run();
