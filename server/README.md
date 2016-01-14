#Hobocode Server

##Development

1. `npm install`
2. `node app.js`

###`GET /api/v1/robots/<robot url_name>`

get a robot

###`POST /api/v1/robots`

Create a robot

####Body

```js
{
  "botname": "My Robot",
  "code": "this is my code",
  "password": "optional-password-here"
}
```

####Response

#####201

Success: Robot created and stored

```js
{
  "id": 8
  "url_name": "my_robot",
  "name": "My Robot",
  "code": "this is my code",
  "updatedAt": "2016-01-14T19:08:33.134Z",
  "createdAt": "2016-01-14T19:08:33.134Z"
}
```

#####412

Failure: Name not unique enough, conflicts with existing robot

```js
{
  "error": "Robot with too similar name exists"
}
```

alter a robot:
`PUT /api/v1/<robot url_name>/<robot code text>`
