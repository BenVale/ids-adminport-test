# ids-adminport-test

This will ping InDesignServer using the adminport 'ping' message every 5 seconds.
Currently it will fail 1-4 times over a 24hr period.
We need it to work 100% of the time.
- Add/remove servers to the `servers[]` array for testing

## Build Setup

```bash
# install dependencies
$ npm install

# run
$ node index.js
# ids-adminport-test
