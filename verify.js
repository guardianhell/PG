const jwt = require("jsonwebtoken");

module.exports = async function (req, res, next) {
  try {



    var token = req.headers.cookie;

    console.log(token);


    if (!token) {
      return res.status(401).send("Access Denied");
    }

    token = token.replace("Authorization=", "");

    const verified = await jwt.verify(
      token,
      process.env.AUTHTOKEN,
      (error, result) => {
        if (error) {
          const errorMessage = {
            Code: 401,
            message: "Forbidden",
          };
          return res.status(401).send(errorMessage);
        } else {
          console.log(result);
          req.user = result;
          next();
        }
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};
