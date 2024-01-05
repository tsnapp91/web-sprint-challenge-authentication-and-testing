const db = require("../../data/dbConfig");
const bcrypt = require("bcrypt");

function validateInput(req, res, next) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "username and password required" });
  }
  next();
}

async function checkUsernameAvailability(req, res, next) {
  const { username } = req.body;
  const existingUser = await db("users").where("username", username).first();
  if (existingUser) {
    return res.status(400).json({ message: "username taken" });
  }
  next();
}

async function validateCredentials(req, res, next) {
  const { username, password } = req.body;
  const user = await db("users").where("username", username).first();

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "invalid credentials" });
  }

  req.user = user;
  next();
}

module.exports = {
  checkUsernameAvailability,
  validateInput,
  validateCredentials,
};
