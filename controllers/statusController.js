const moment = require("moment");
const db = require("../util/dbconnections");
const router = require("express").Router();
const verify = require("../verify");
const validation = require("../validations");
const { text } = require("body-parser");

exports.addNewStatus = async function (req, res) {
  try {
    const valid = await validation.addStatusValidation(req.body);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }
    const exist = await getStatusByName(req.body.status_name);

    if (exist.length != 0) {
      return res.status(417).send("Status name has been used");
    }

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    await db.pool.query(
      {
        text: "INSERT INTO status(status_name, created_at, updated_at) VALUES ($1,$2,$3) RETURNING *",
        values: [req.body.status_name, created_at, updated_at],
      },
      (error, result) => {
        if (error) {
          return res.status(401).send(error);
        }
        return res.status(200).send(result.rows);
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.getAllStatusData = async function (req, res) {
  try {
    const result = await db.pool.query({ text: "SELECT * FROM status" });

    return res.status(200).send(result.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchStatusByName = async function (req, res) {
  try {
    const valid = await validation.searchStatusNameValidation(req.params);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    const result = await getStatusByName(req.params.name);
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchStatusById = async function (req, res) {
  try {
    const valid = await validation.searchByIdValidation(req.params);

    if (valid.error) {
      return res.status(417).send(valid.error);
    }

    const result = await getStatusById(req.params.id);
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.updateStatus = async function (req, res) {};

// FUNCTION

async function getStatusByName(statusName) {
  const result = await db.pool.query({
    text: "SELECT * FROM status Where LOWER(status_name) = $1",
    values: [statusName.toLowerCase()],
  });

  return result.rows;
}

exports.getStatusById = async function (id) {
  const result = await db.pool.query({
    text: "SELECT * FROM status Where id = $1",
    values: [id],
  });

  return result.rows;
};

module.exports.getStatusByName = getStatusByName;
