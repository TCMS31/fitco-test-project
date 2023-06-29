# Reproducing the original defects

Every entry in the README's ["What was fixed"](../README.md#what-was-fixed)
table was reproduced before being changed. This file is the literal evidence
for the server-side ones.

The pre-uplift `api/` tree was extracted from git (`git archive HEAD api`) into
a scratch directory, pointed at a throwaway PostgreSQL 17.6 database, and run
unmodified on port 8702. Output below is verbatim.

## 4. `POST /users` returned the bcrypt hash in the response body

```
$ curl -s -X POST http://localhost:8702/api/users \
    -H 'Content-Type: application/json' \
    -d '{"firstName":"Test","lastName":"Case","email":"t@c.example","password":"secret123"}'

{"id":1,"firstName":"Test","lastName":"Case","email":"t@c.example",
 "password":"$2a$08$F5ncdTFfzIOmFHJiswc6l.fQSrLwpJYqoZOh16h0DWjxH5pz7QPk6",
 "updatedAt":"2026-09-24T16:17:43.844Z","createdAt":"2026-09-24T16:17:43.844Z"}
```

The controller did `res.status(201).send(user)` on the raw Sequelize instance.
Fixed by a `defaultScope` that excludes `password` plus an explicit
`toPublicUser` projection in the service, and asserted by three tests in
`api/tests/user.api.test.js`.

## 2. Updating a non-existent user reported success

```
$ curl -s -i -X PUT http://localhost:8702/api/users/999999 \
    -H 'Content-Type: application/json' -d '{"firstName":"Ghost"}'

HTTP/1.1 200 OK
{"success":true,"message":"User updated successfully"}
```

`User.update` resolves to `[affectedCount]`. The controller tested that array
for truthiness, and `[0]` is truthy. Now a 404.

## 3. Deleting a non-existent user returned 500

```
$ curl -s -i -X DELETE http://localhost:8702/api/users/999999

HTTP/1.1 500 Internal Server Error
{"success":false,"message":"Couldn't delete user"}
```

`User.destroy` resolving to `0` means "no such row", not "the server broke".
Now a 404.

## 9. Duplicate emails were accepted

```
$ curl -s -o /dev/null -w "second POST status: %{http_code}\n" \
    -X POST http://localhost:8702/api/users \
    -H 'Content-Type: application/json' \
    -d '{"firstName":"Test","lastName":"Case","email":"t@c.example","password":"secret123"}'

second POST status: 201
```

The model declared no unique constraint on `email`. There is now a unique index
plus a pre-insert check that returns 409.

## 7. Any unhandled rejection leaked an HTML stack trace with absolute paths

Omitting `password` made `bcrypt.hash(undefined, 8)` throw. With no error
middleware registered, Express's default handler answered:

```
$ curl -s -X POST http://localhost:8702/api/users \
    -H 'Content-Type: application/json' \
    -d '{"firstName":"A","lastName":"B","email":"x@y.example"}'

HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Error: Illegal arguments: undefined, number<br>
   at _async (/Users/dev/Documents/Projects/.../api/node_modules/bcryptjs/dist/bcrypt.js:214:46)<
...
```

Note the leaked filesystem path. The same request is now a `400` with
per-field detail, `x-powered-by` is disabled, and unknown routes answer JSON:

```
$ curl -s -o /dev/null -w "GET /api/nope -> %{http_code} %{content_type}\n" \
    http://localhost:8702/api/nope
GET /api/nope -> 404 text/html; charset=utf-8     # original
GET /api/nope -> 404 application/json             # now
```

## Client-side defects

5, 6, 8 and 13 are front-end and were established by reading the code and then
pinned with regression tests rather than by curl:

- `src/__tests__/App.test.js` → *"returns to create mode after an edit is
  cancelled"* fails against the original component, which sent
  `PUT /api/users/undefined`.
- `src/__tests__/httpClient.test.js` → *"falls back to a relative /api instead
  of 'undefined/api'"*.
- `src/__tests__/App.test.js` → *"shows a recoverable error state when the API
  is unreachable"*.
- `src/__tests__/App.test.js` queries the row controls by accessible name
  (`Edit Amelia Hartley`), which only resolves because they are now `<button>`
  elements with `aria-label`s rather than bare `<div onClick>`.
