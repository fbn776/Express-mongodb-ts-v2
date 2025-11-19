# Dev Tools

This doc contains documentation for developer tools for this project;

> **NOTE**: 
> These tools are only available in `development` (ENVIRONMENT="development") mode. They should not be used in production.

## Mongo Shell

There's a `development` (ENV) only endpoint for accessing a mongo shell in the running container. This is useful for
debugging and inspecting the database, and also adding data (seeding).

To access the mongo shell, run the following command:

```
POST /dev/mongo-shell
Content-Type: application/json
{
     "model": "<name of the model (colletion)>",
     "command": "<mongo shell command (find, create, etc)>",
     "args": {<arguments for the command>}
}
```

For example, to find all users in the `users` collection, you would run:

```
POST /dev/mongo-shell
{
     "model": "users",
     "command": "find",
     "args": [{}]
}
```

---

## Realtime Logs

There's a `development` (ENV) only endpoint for accessing realtime logs from the running container.

This returns all logs from the `stdout` and `stderr` streams of the container.
`GET /dev/logs`

Returns an html file with a script that connects to a websocket and streams the logs in realtime.

---

## Get all environment variables

Gets all environment variables from the running container.

`GET /dev/all-env`

---


