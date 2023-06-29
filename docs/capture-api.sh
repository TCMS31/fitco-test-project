set -u
B=http://localhost:8700/api
show() {
  echo "\$ curl -i -s -X $1 '$2'${3:+ \\
     -H 'Content-Type: application/json' \\
     -d '$3'}"
  if [ -n "${3:-}" ]; then
    curl -s -D - -o /tmp/body.json -X "$1" "$2" -H 'Content-Type: application/json' -d "$3" \
      | sed -n '1p;/^[Cc]ontent-[Tt]ype:/p;/^[Ll]ocation:/p'
  else
    curl -s -D - -o /tmp/body.json -X "$1" "$2" | sed -n '1p;/^[Cc]ontent-[Tt]ype:/p;/^[Ll]ocation:/p'
  fi
  if [ -s /tmp/body.json ]; then python3 -m json.tool /tmp/body.json 2>/dev/null || cat /tmp/body.json; fi
  echo
}
echo "### 1. Health check"
show GET "$B/health"
echo "### 2. A bounded, paginated list (limit is capped server-side)"
show GET "$B/users?page=1&limit=3"
echo "### 3. Create a user -- 201 with a Location header, no password in the body"
show POST "$B/users" '{"firstName":"Nina","lastName":"Petrov","email":"Nina.Petrov@Fitco.Example","password":"Passw0rd!123"}'
echo "### 4. The same email again -- 409, not a 500 stack trace"
show POST "$B/users" '{"firstName":"Nina","lastName":"Petrov","email":"nina.petrov@fitco.example","password":"Passw0rd!123"}'
echo "### 5. Validation failure -- 400 with per-field detail"
show POST "$B/users" '{"firstName":"","lastName":"Petrov","email":"not-an-email","password":"short"}'
echo "### 6. Update a user that does not exist -- 404"
echo "###    (the original controller answered 200 \"User updated successfully\" here)"
show PUT "$B/users/999999" '{"firstName":"Ghost"}'
echo "### 7. Delete a user that does not exist -- 404"
echo "###    (the original controller answered 500 \"Couldn't delete user\" here)"
show DELETE "$B/users/999999"
echo "### 8. Unknown route -- JSON 404, not Express's HTML page"
show GET "$B/nope"
