# API transcript

Captured by running the API on `http://localhost:8700` against PostgreSQL 17.6
with the demo seed loaded (34 users), then replaying `docs/capture-api.sh`.
Every response below is literal output; only the repetitive `curl -D -` header
noise is trimmed to the status line, `Content-Type` and `Location`.

Reproduce it with:

```bash
cd api && SEED_ON_BOOT=true npm start          # terminal 1
sh docs/capture-api.sh > docs/api-transcript.md  # terminal 2
```

### 1. Health check
$ curl -i -s -X GET 'http://localhost:8700/api/health'
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
{
    "status": "ok",
    "database": "up"
}

### 2. A bounded, paginated list (limit is capped server-side)
$ curl -i -s -X GET 'http://localhost:8700/api/users?page=1&limit=3'
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
{
    "success": true,
    "data": [
        {
            "id": 1,
            "firstName": "Amelia",
            "lastName": "Hartley",
            "email": "amelia.hartley@fitco.example",
            "createdAt": "2026-09-24T16:11:05.071Z",
            "updatedAt": "2026-09-24T16:11:05.071Z"
        },
        {
            "id": 2,
            "firstName": "Rajesh",
            "lastName": "Iyer",
            "email": "rajesh.iyer@fitco.example",
            "createdAt": "2026-09-24T16:11:05.123Z",
            "updatedAt": "2026-09-24T16:11:05.123Z"
        },
        {
            "id": 3,
            "firstName": "Sofia",
            "lastName": "Marchetti",
            "email": "sofia.marchetti@fitco.example",
            "createdAt": "2026-09-24T16:11:05.127Z",
            "updatedAt": "2026-09-24T16:11:05.127Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 3,
        "total": 34,
        "totalPages": 12
    }
}

### 3. Create a user -- 201 with a Location header, no password in the body
$ curl -i -s -X POST 'http://localhost:8700/api/users' \
     -H 'Content-Type: application/json' \
     -d '{"firstName":"Nina","lastName":"Petrov","email":"Nina.Petrov@Fitco.Example","password":"Passw0rd!123"}'
HTTP/1.1 201 Created
Location: /api/users/35
Content-Type: application/json; charset=utf-8
{
    "success": true,
    "data": {
        "id": 35,
        "firstName": "Nina",
        "lastName": "Petrov",
        "email": "nina.petrov@fitco.example",
        "createdAt": "2026-09-24T16:11:30.912Z",
        "updatedAt": "2026-09-24T16:11:30.912Z"
    }
}

### 4. The same email again -- 409, not a 500 stack trace
$ curl -i -s -X POST 'http://localhost:8700/api/users' \
     -H 'Content-Type: application/json' \
     -d '{"firstName":"Nina","lastName":"Petrov","email":"nina.petrov@fitco.example","password":"Passw0rd!123"}'
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8
{
    "success": false,
    "error": {
        "code": "conflict",
        "message": "A user with that email already exists",
        "details": {
            "email": "nina.petrov@fitco.example"
        }
    }
}

### 5. Validation failure -- 400 with per-field detail
$ curl -i -s -X POST 'http://localhost:8700/api/users' \
     -H 'Content-Type: application/json' \
     -d '{"firstName":"","lastName":"Petrov","email":"not-an-email","password":"short"}'
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
{
    "success": false,
    "error": {
        "code": "bad_request",
        "message": "Request validation failed",
        "details": [
            {
                "field": "firstName",
                "message": "firstName must not be empty"
            },
            {
                "field": "email",
                "message": "email must be a valid email address"
            },
            {
                "field": "password",
                "message": "password must be at least 8 characters"
            }
        ]
    }
}

### 6. Update a user that does not exist -- 404
###    (the original controller answered 200 "User updated successfully" here)
$ curl -i -s -X PUT 'http://localhost:8700/api/users/999999' \
     -H 'Content-Type: application/json' \
     -d '{"firstName":"Ghost"}'
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
{
    "success": false,
    "error": {
        "code": "not_found",
        "message": "User 999999 not found"
    }
}

### 7. Delete a user that does not exist -- 404
###    (the original controller answered 500 "Couldn't delete user" here)
$ curl -i -s -X DELETE 'http://localhost:8700/api/users/999999'
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
{
    "success": false,
    "error": {
        "code": "not_found",
        "message": "User 999999 not found"
    }
}

### 8. Unknown route -- JSON 404, not Express's HTML page
$ curl -i -s -X GET 'http://localhost:8700/api/nope'
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
{
    "success": false,
    "error": {
        "code": "not_found",
        "message": "No route matches GET /api/nope"
    }
}

