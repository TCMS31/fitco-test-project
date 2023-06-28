import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";

import App from "../App";
import { httpClient } from "../api/httpClient";

let mock;

const makeUsers = (count, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({
    id: offset + i + 1,
    firstName: `First${offset + i + 1}`,
    lastName: `Last${offset + i + 1}`,
    email: `user${offset + i + 1}@fitco.example`,
  }));

const pageReply = (
  users,
  { page = 1, limit = 10, total = users.length } = {}
) => ({
  success: true,
  data: users,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  },
});

beforeEach(() => {
  mock = new MockAdapter(httpClient);
});

afterEach(() => {
  mock.restore();
});

describe("user list", () => {
  it("renders users returned by the API", async () => {
    mock.onGet("/users").reply(200, pageReply(makeUsers(3)));

    render(<App />);

    expect(await screen.findByText("First1 Last1")).toBeInTheDocument();
    expect(screen.getByText("user3@fitco.example")).toBeInTheDocument();
    expect(screen.getByText(/3 registered users/i)).toBeInTheDocument();
  });

  it("shows an empty state rather than a bare table when there are no users", async () => {
    mock.onGet("/users").reply(200, pageReply([], { total: 0 }));

    render(<App />);

    expect(await screen.findByText(/no users yet/i)).toBeInTheDocument();
  });

  // Regression: every await in the original client was unguarded, so a failed
  // request produced an unhandled rejection and an indistinguishable blank table.
  it("shows a recoverable error state when the API is unreachable", async () => {
    mock.onGet("/users").networkError();

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not load users/i
    );
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("retries the request when Try again is pressed", async () => {
    mock.onGet("/users").networkError();

    render(<App />);
    await screen.findByRole("alert");

    mock.reset();
    mock.onGet("/users").reply(200, pageReply(makeUsers(1)));

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("First1 Last1")).toBeInTheDocument();
  });

  it("pages through results instead of loading the whole table", async () => {
    mock.onGet("/users").reply((config) => {
      const { page } = config.params;

      return [
        200,
        pageReply(makeUsers(10, (page - 1) * 10), {
          page,
          limit: 10,
          total: 25,
        }),
      ];
    });

    render(<App />);
    await screen.findByText("First1 Last1");
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(await screen.findByText("First11 Last11")).toBeInTheDocument();
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
  });
});

describe("creating a user", () => {
  it("POSTs the form and refreshes the list", async () => {
    mock.onGet("/users").replyOnce(200, pageReply([], { total: 0 }));
    const posted = [];
    mock.onPost("/users").reply((config) => {
      posted.push(JSON.parse(config.data));

      return [201, { success: true, data: { id: 1 } }];
    });
    mock.onGet("/users").reply(200, pageReply(makeUsers(1)));

    render(<App />);
    await screen.findByText(/no users yet/i);

    // The header and the empty state both offer "Add user"; either opens the form.
    await userEvent.click(
      screen.getAllByRole("button", { name: /add user/i })[0]
    );

    const dialog = await screen.findByRole("dialog");
    await userEvent.type(
      within(dialog).getByLabelText(/first name/i),
      "Amelia"
    );
    await userEvent.type(
      within(dialog).getByLabelText(/last name/i),
      "Hartley"
    );
    await userEvent.type(
      within(dialog).getByLabelText(/email/i),
      "amelia@fitco.example"
    );
    await userEvent.type(
      within(dialog).getByLabelText(/password/i),
      "Passw0rd!1"
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: /create user/i })
    );

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      firstName: "Amelia",
      lastName: "Hartley",
      email: "amelia@fitco.example",
      password: "Passw0rd!1",
    });
    expect(await screen.findByText("First1 Last1")).toBeInTheDocument();
  });

  it("surfaces a server-side validation error and keeps the form open", async () => {
    mock.onGet("/users").reply(200, pageReply([], { total: 0 }));
    mock.onPost("/users").reply(409, {
      success: false,
      error: {
        code: "conflict",
        message: "A user with that email already exists",
      },
    });

    render(<App />);
    await screen.findByText(/no users yet/i);
    await userEvent.click(
      screen.getAllByRole("button", { name: /add user/i })[0]
    );

    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/first name/i), "A");
    await userEvent.type(within(dialog).getByLabelText(/last name/i), "B");
    await userEvent.type(
      within(dialog).getByLabelText(/email/i),
      "a@b.example"
    );
    await userEvent.type(
      within(dialog).getByLabelText(/password/i),
      "Passw0rd!1"
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: /create user/i })
    );

    expect(
      await within(dialog).findByText(/already exists/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("editing a user", () => {
  it("prefills the form, hides the password field and PUTs the change", async () => {
    mock.onGet("/users").reply(200, pageReply(makeUsers(1)));
    const puts = [];
    mock.onPut("/users/1").reply((config) => {
      puts.push(JSON.parse(config.data));

      return [200, { success: true, data: { id: 1 } }];
    });

    render(<App />);
    await screen.findByText("First1 Last1");

    await userEvent.click(
      screen.getByRole("button", { name: /edit first1 last1/i })
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/first name/i)).toHaveValue("First1");
    expect(
      within(dialog).queryByLabelText(/password/i)
    ).not.toBeInTheDocument();

    await userEvent.clear(within(dialog).getByLabelText(/first name/i));
    await userEvent.type(
      within(dialog).getByLabelText(/first name/i),
      "Renamed"
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: /save changes/i })
    );

    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0].firstName).toBe("Renamed");
  });

  // Regression: the original tracked edit mode in an `isUserUpdating` flag that
  // was never cleared when the modal closed, so the next "Add user" submitted a
  // PUT to /users/undefined instead of a POST.
  it("returns to create mode after an edit is cancelled", async () => {
    mock.onGet("/users").reply(200, pageReply(makeUsers(1)));
    const posts = [];
    const puts = [];
    mock.onPost("/users").reply((config) => {
      posts.push(JSON.parse(config.data));

      return [201, { success: true, data: { id: 2 } }];
    });
    mock.onPut(/\/users\/.*/).reply((config) => {
      puts.push(config.url);

      return [200, { success: true, data: {} }];
    });

    render(<App />);
    await screen.findByText("First1 Last1");

    await userEvent.click(
      screen.getByRole("button", { name: /edit first1 last1/i })
    );
    const editDialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(editDialog).getByRole("button", { name: /cancel/i })
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /add user/i }));
    const createDialog = await screen.findByRole("dialog");

    expect(within(createDialog).getByLabelText(/first name/i)).toHaveValue("");
    expect(
      within(createDialog).getByLabelText(/password/i)
    ).toBeInTheDocument();

    await userEvent.type(
      within(createDialog).getByLabelText(/first name/i),
      "New"
    );
    await userEvent.type(
      within(createDialog).getByLabelText(/last name/i),
      "Person"
    );
    await userEvent.type(
      within(createDialog).getByLabelText(/email/i),
      "new@fitco.example"
    );
    await userEvent.type(
      within(createDialog).getByLabelText(/password/i),
      "Passw0rd!1"
    );
    await userEvent.click(
      within(createDialog).getByRole("button", { name: /create user/i })
    );

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(puts).toHaveLength(0);
  });
});

describe("deleting a user", () => {
  it("asks for confirmation before issuing the DELETE", async () => {
    mock.onGet("/users").reply(200, pageReply(makeUsers(1)));
    let deleted = 0;
    mock.onDelete("/users/1").reply(() => {
      deleted += 1;

      return [204];
    });

    render(<App />);
    await screen.findByText("First1 Last1");

    await userEvent.click(
      screen.getByRole("button", { name: /delete first1 last1/i })
    );

    const dialog = await screen.findByRole("dialog");
    expect(deleted).toBe(0);

    await userEvent.click(
      within(dialog).getByRole("button", { name: /delete user/i })
    );

    await waitFor(() => expect(deleted).toBe(1));
  });

  it("reports a failed delete instead of silently doing nothing", async () => {
    mock.onGet("/users").reply(200, pageReply(makeUsers(1)));
    mock.onDelete("/users/1").reply(404, {
      success: false,
      error: { code: "not_found", message: "User 1 not found" },
    });

    render(<App />);
    await screen.findByText("First1 Last1");

    await userEvent.click(
      screen.getByRole("button", { name: /delete first1 last1/i })
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /delete user/i })
    );

    expect(await within(dialog).findByText(/not found/i)).toBeInTheDocument();
  });
});
