const { Swagger } = require('../dist');

class MyAPI extends Swagger {
  constructor () {
    super();
  }
}

const api = new MyAPI();

api.run();
