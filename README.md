# Chlu DID Service

(WIP) Service to Authenticate using a [Chlu](https://chlu.io) DID

Also has a couple API calls to read DIDs and Chlu unverified reviews

### Using

- `yarn` to install deps
- `yarn start` to start a server. Use `--help` for configuration options
- `yarn test` to run tests

### HTTP Docs

- `GET /` use this to check if the service is up
- `GET /did/:didId`
  - `didId` is either a Chlu DID UUID or a multihash for the DID Document
  - returns the associated DID Document in `application/json`
- `GET /reputation/:didId`
  - `didId` is either a Chlu DID UUID or a multihash for the DID Document
  - returns the associated Chlu Reputation JSON in this format: `{ reviews: [...] }`
- `GET /did/login/:didId/:nonce/:signature`
  - `didId` is either a Chlu DID UUID or a multihash for the DID Document
  - `nonce` is a string that has been signed by the DID Private Key
  - `signature` is a hex encoded signature of the `nonce` using the private key of the DID
  - returns an object of the form `{ valid: Boolean, ddo: Object }`. Valid will be true if the auth succeeded. DDO is only present if valid and contains the reputation object
  - error if the authentication has failed
