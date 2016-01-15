import * as Urlify from 'urlify';

const urlify = Urlify.create();

export class APIClient {
  apiRoot: string;

  /**
   * @param apiRoot the full url of the API root including the trailing slash
   */
  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  getRobot(name: string): Promise<{}> {
    return new Promise((resolve, reject) => {
      const xhr: XMLHttpRequest = new XMLHttpRequest();
      xhr.open('GET', `${this.apiRoot}/robots/${urlify(name)}`);

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
}

var client: APIClient = new APIClient('http://localhost:3000/api/v1/');
client.getRobot('nunu bot').then((response) => console.log(response));
