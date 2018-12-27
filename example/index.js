const swagger = require('../dist');
const serverless = require('../dist/plugins/serverless');

const api = new swagger.Swagger({
  plugins: {
    serverless: new serverless.ServerlessPlugin({
      filepath: './test.yaml',
      aggregateByFunctionName: true,
    }),
  }
});

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

const errObject = new swagger.Component(api, 'Error', {
  required: [
    'code',
    'message',
  ],
  properties: {
    'code': swagger.Schema.int32(),
    'message': swagger.Schema.string(),
  }
});

const petObject = new swagger.Component(api, 'Pet', {
  required: [
    'id',
    'name',
  ],
  properties: {
    'id': swagger.Schema.int64(),
    'name': swagger.Schema.string(),
    'tag': swagger.Schema.string(),
  },
});

const petsObject = new swagger.Component(api, 'Pets', {
  type: 'array',
  items: petObject,
});

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
    schema: swagger.Schema.int32(),
  })
  .addResponse(
    '200',
    new swagger.Response({
      description: 'A paged array of pets'
    })
    .addHeader('x-next', {
      description: 'A link to the next page of responses',
      schema: swagger.Schema.string(),
    })
    .addContent('application/json', petObject)
  )
  .addResponse(
    'default',
    new swagger.Response({
      description: 'unexpected error',
    })
    .addContent('application/json', errObject)
  ),
  {
    serverless: {
      functionName: 'pets',
    }
  }
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
    .addContent('application/json', errObject)
  ),
  {
    serverless: {
      functionName: 'pets',
      apigateway: {
        cors: true
      }
    }
  }
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
    .addContent('application/json', petsObject)
  )
  .addResponse(
    'default',
    new swagger.Response({
      description: 'unexpected error',
    })
    .addContent('application/json', errObject)
  ),
  {
    serverless: {
      functionName: 'pets',
      apigateway: {
        cors: true
      }
    }
  }
);

api.run();
