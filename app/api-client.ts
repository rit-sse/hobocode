import * as Urlify from 'urlify';

const urlify = Urlify.create();

const makeRequestPromise(method: string, url: string): Promise<{}> {
  return new Promise((resolve, reject) => {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    xhr.open(method, url);

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(JSON.parse(xhr.responseText));
      }
    };

    xhr.send();
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
}

var client: APIClient = new APIClient('http://localhost:3000/api/v1/');
client.getRobot('nunu bot').then((response) => console.log(response));
