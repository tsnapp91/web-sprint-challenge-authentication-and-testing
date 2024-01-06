// Write your tests here
const request = require("supertest");
const server = require("./server");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./secrets");
const db = require("../data/dbConfig");
// const bcrypt = require("bcrypt");

const generateTestToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

// Sanity test
test("sanity", () => {
  expect(true).toBe(true);
});
// Enviorment test
test("correct enviorment variable", () => {
  expect(process.env.NODE_ENV).toBe("testing");
});
// restricted endpoint test
describe("[GET] / protected jokes endpoint", () => {
  const testPayload = { id: "123", username: "testuser" };
  const testToken = generateTestToken(testPayload);

  test("should return 401 without a token", async () => {
    const response = await request(server).get("/api/jokes");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Token required" });
  });

  test("should return 200 with a valid token", async () => {
    const response = await request(server)
      .get("/api/jokes")
      .set("Authorization", ` ${testToken}`);
    expect(response.status).toBe(200);
  });
});
// register endpoint
describe("POST /register endpoint", () => {
  beforeEach(async () => {
    await db.migrate.rollback();
    await db.migrate.latest();
  });

  afterEach(async () => {
    await db("users").truncate();
  });

  test("should register a new user and return 201", async () => {
    const newUser = {
      username: "testuser",
      password: "testpassword",
    };
    const response = await request(server)
      .post("/api/auth/register")
      .send(newUser)
      .expect(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.username).toBe(newUser.username);

    const userInDb = await db("users").where("id", response.body.id).first();
    expect(userInDb).toMatchObject({
      username: newUser.username,
    });
  });

  test("should return 409 if username is already taken", async () => {
    const existingUser = {
      username: "existinguser",
      password: "existingpassword",
    };
    await db("users").insert(existingUser);

    const duplicateUser = {
      username: "existinguser",
      password: "newpassword",
    };

    const response = await request(server)
      .post("/api/auth/register")
      .send(duplicateUser)
      .expect(400);

    expect(response.body).toEqual({ message: "username taken" });
  });
});

// login endpoint
describe("POST /login endpoint", () => {
  beforeEach(async () => {
    await db.migrate.rollback();
    await db.migrate.latest();
  });

  test("should return 200 with a valid login", async () => {
    const validUser = {
      username: "testuser",
      password: "testpass",
    };
    // const hash = bcrypt.hashSync(validUser.password, 8);
    // validUser.password = hash;
    await db("users").insert(validUser);
    const response = await request(server)
      .post("/api/auth/login")
      .send(validUser)
      .expect(200);
    expect(response.body).toHaveProperty("token");
  });
  // test("should return 401 with invalid credentials", async () => {
  //   const response = await request(server)
  //     .post("/api/auth/login")
  //     .send(invalidUser)
  //     .expect(401);

  //   expect(response.body).toEqual({ message: "invalid credentials" });
  // });
});
