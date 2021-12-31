const bcrypt = require("bcrypt");
const admin = require("../model/admin");
const jwt = require("jsonwebtoken");

module.exports.handleRegister = async (req, res) => {
  const body = req.body;
  const email = body.email;
  const password = body.password;

  if (!email && !password) {
    return res
      .status(400)
      .json({ success: false, msg: "No email or password" });
  }

  const saltRounds = 10;
  const hashedpass = await bcrypt.hash(password, saltRounds);

  try {
    const checkEmailResults = await admin.checkEmail(email);
    if (checkEmailResults.length == 0) {
      const inseradminResults = await admin.insertAdmin(email, hashedpass);
      res.status(200).json({ success: true, msg: "admin Inserted" });
    } else {
      res.status(400).json({ success: false, msg: "email already exists" });
    }
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

module.exports.handleLogin = async (req, res) => {
  const body = req.body;
  const email = body.email;
  const password = body.password;
  if (
    email === "" ||
    password === "" ||
    typeof email == "undefined" ||
    typeof password == "undefined"
  ) {
    return res
      .status(400)
      .json({ success: false, token: "empty email or password" });
  }
  try {
    const loginQuery = await admin.login(email);
    if (loginQuery.length == 0) {
      return res
        .status(400)
        .json({ success: false, token: "admin doesn't exist" });
    }
    const storedPassword = loginQuery[0].password;
    const passwordMatch = await bcrypt.compare(password, storedPassword);
    if (!passwordMatch) {
      return res.send({ success: false, token: "password doesn't match" });
    }
    const jwt_token = await jwt.sign(
      { adminID: loginQuery[0].adminID },
      process.env.JWT_SECRET_TOKEN
    );
    res.status(200).cookie("jwt-admin", jwt_token, {
      maxAge: 7 * 84600 * 1000,
      httpOnly: true,
    });
    return res.status(200).json({ success: true, token: jwt_token });
  } catch (err) {
    return res.json(err);
  }
};

module.exports.checkLogin = async (req, res) => {
  const cookieToken = req.cookies["jwt-admin"];
  const authorizationToken = req.headers["authorization-admin"];
  if (!cookieToken && !authorizationToken) {
    return res.status(200).json({ success: false, msg: "Token doesn't exist" });
  }

  let token = cookieToken ? cookieToken : authorizationToken;

  try {
    const payload = await jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    return res.status(200).send({ success: true, msg: "autheticated" });
  } catch (err) {
    return res.status(400).json({ success: false, msg: err.message });
  }
};
