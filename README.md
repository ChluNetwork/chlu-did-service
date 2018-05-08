# Chlu DID Service

(WIP) Service to Authenticate using a [Chlu](https://chlu.io) DID

Also has a couple API calls to read DIDs and Chlu reputation

### Configuring

This project uses environment variables for configuration, but works out of the box

You can use:

- `$DIRECTORY` to customize where the files are saved on disk
- `$TOKEN` to set a required API token as a get query parameter named `token`. Requests without this token will fail

### Using

This project is very WIP at the moment

- `yarn` to install deps
- `yarn start` to start a server
  - you can use `$PORT` env variable to customize the port, defaults to 3000
- `yarn test` to run tests