import * as devkit from '../src/index';

describe('Swagger', () => {
  const swagger = new devkit.Swagger();

  it('should add info', () => {
    const infoProps: devkit.InfoProps = {
      title: 'title',
      description: 'description',
      version: '1.0.0',
    }

    swagger.addInfo(infoProps);

    const actual: any = swagger.render();

    expect(actual['info']).toBe(infoProps);
  });

  it('should add servers', () => {
    const serversProps: Array<devkit.ServerProps> = [
      {
        url: 'http://serverA.com',
        description: 'serverA',
      },
      {
        url: 'http://serverB.com',
        description: 'serverB',
      },
    ];

    swagger.addServers(serversProps);

    const actual: any = swagger.render();

    expect(actual['servers']).toBe(serversProps);
  });
});

