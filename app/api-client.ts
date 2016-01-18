import * as Urlify from 'urlify';

const urlify = Urlify.create();

const makeRequestPromise(method: string, url: string, body?: {}): Promise<{}> {
  return new Promise((resolve, reject) => {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(JSON.parse(xhr.responseText));
      }
    };

    body === undefined ? xhr.send() : xhr.send(JSON.stringify(body));
  });
}

export class APIClient {
  apiRoot: string;

  /**
   * @param apiRoot the full url of the API root including the trailing slash
   */
  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  getRobot(name: string): Promise<{}> {
    return makeRequestPromise('GET', `${this.apiRoot}/robots/${urlify(name)}`);
  }

  createRobot(robot: {botname: string, code: string, password?: string}) {
  }
}

var client: APIClient = new APIClient('http://localhost:3000/api/v1/');
client.getRobot('nunu bot').then((response) => console.log(response));
client.createRobot({botname: `MyBot${Date.now()}`, code: 'foo'}).then((r) => console.log(r));
