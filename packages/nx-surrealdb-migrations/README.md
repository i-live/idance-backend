# nx-surrealdb-migrations

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build nx-surrealdb-migrations` to build the library.

## Running unit tests

Run `nx test nx-surrealdb-migrations` to execute the unit tests via [Jest](https://jestjs.io).

## Executor Functionalities

### Migration Structure
* It accepts migration file that can be grouped into folders (paths). the folders are numbered and so are the migration files themselves.
* The path and file names can be in the following formats:
  * path: `002_auth` NNN_xxxx
  * file: `0002_auth.surql` NNNN_xxxxxxx.surql
* Accepts a 'path' argument to specify the directory where migration files are located. this can be any of the following:
  * `2`
  * `002`
  * `auth`
  * `002_auth`
It will automatically find the matching directory.
* Accepts a 'file' argument to specify the migration file to run. This also has a similar requirement as the path argument.

### Logging in the Migration Table
* all migrations are logged in the `migrations` table.
* if a migration is already in a 'up' state it can be migrated 'down'.
* if the migration is in a 'down' state or if its never been run before, it can be migrated 'up'.
