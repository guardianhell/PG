const moment = require("moment");
const db = require("../util/dbconnections");
const verify = require("../verify");
const { text } = require("body-parser");
const validation = require("../validations");
const { Router } = require("express");

exports.addNewUnit = async function (req, res) {
  try {
    const valid = await validation.addUnitValidation(req.body);
    console.log(valid);
    if (valid.error) {
      console.log(valid.error);
      return res.status(417).send(valid.error);
    }

    const exist = await getUnitByName(req.body.unit_name);

    if (exist.length != 0) {
      return res.status(406).send("Unit Name has been used");
    }

    let created_at = moment().valueOf();
    let updated_at = moment().valueOf();

    await db.pool.query(
      {
        text: "INSERT INTO unit(unit_name,created_at,updated_at) VALUES($1,$2,$3) RETURNING *",
        values: [req.body.unit_name, created_at, updated_at],
      },
      (error, result) => {
        if (error) {
          return res.status(417).send(error);
        }
        return res.status(200).send(result.rows);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};

exports.getAllUnitData = async function (req, res) {
  try {
    const result = await db.pool.query({ text: "SELECT * FROM unit" });

    return res.status(200).send(result.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
};

exports.searchUnitByName = async function (req, res) {
  try {
    const valid = await validation.searchUnitByNameValidation(req.params);

    if (valid.error) {
      return res.status(417).send("Invalid Unit Name");
    }

    const result = await getUnitByName(req.params.unit_name);

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};

exports.searchUnitById = async function (req, res) {
  try {
    const valid = await validation.searchByIdValidation(req.params);

    if (valid.error) {
      return res.status(417).send("Invalid Unit Id");
    }

    const result = await getUnitById(req.params.id);

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};

exports.updateUnit = async function (req, res) {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};

//FUNCTION

async function getUnitByName(name) {
  const result = await db.pool.query({
    text: "SELECT * FROM unit where LOWER(unit_name) = $1",
    values: [name.toLowerCase()],
  });
  return result.rows;
}

async function getUnitById(id) {
  const result = await db.pool.query({
    text: "SELECT * FROM unit where id = $1",
    values: [id],
  });
  return result.rows;
}

module.exports.getUnitByName = getUnitByName;
