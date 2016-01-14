#Hobocode Server

##Development

1. `npm install`
2. `node app.js`

##Endpoints

###`GET /api/v1/robots/<robot url_name>`

Get an existing robot

####Response

#####200

```js
{
  "id": 1,
  "name": "My Bot",
  "url_name": "my_bot",
  "code": "this is my code",
  "createdAt": "2016-01-14T19:15:00.685Z",
  "updatedAt": "2016-01-14T19:15:00.685Z"
}
```

#####404

Failure: no bot found

```js
{
	"error": "No robot found"
}
```

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

###`PUT /api/v1/robots`

Alter an existing robot

####Body

```js
{
    "botname": "My Bot",
    "code": "this code is better",
    "password": "optional-password-here"
}
```

####Response

#####200

Success: Robot alteration stored

####Body

```js
{
  "id": 9,
  "name": "My Bot",
  "url_name": "my_bot",
  "code": "this is better code",
  "createdAt": "2016-01-14T19:15:00.685Z",
  "updatedAt": "2016-01-14T19:31:16.371Z"
}
```

#####401

Failure: incorrect password

```js
{
  "error": "Incorrect password"
}
```

#####404

Failure: no robot found

```js
{
  "error": "No robot found"
}
```
