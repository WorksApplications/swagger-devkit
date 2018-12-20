const swagger = require('../dist');

class MyAPI extends swagger.Swagger {
  constructor () {
    super();

    new swagger.Info(this, {
      title: 'Swagger Petstore',
      version: '1.0.0',
    });

    new swagger.Servers(this, [
      {
        url: 'http://petstore.swagger.io/v1'
      }
    ]);
  }
}

const api = new MyAPI();

api.run();
