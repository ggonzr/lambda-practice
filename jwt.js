const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const dynamo = new AWS.DynamoDB.DocumentClient();

// Cargar las variables en el entorno usando el .env en el entorno personal
const dotenv = require("dotenv").config();

/**
 * Permite validar un token
 * @param {*} token JWT Token
 * @returns true/false si el token es valido o no.
 */
const verifyToken = async (token) => {
  let decoded = jwt.verify(token, proces.env.SECRET, function (err, decoded) {
    if (err) {
      return false;
    } else {
      console.log("Token: ", decoded);
      return true;
    }
  });
};

/**
 * Devuelve un token si la clave de acceso es correcta para un logging basico
 * @param {*} password Clave del sistema
 * @returns jwt.token si la clave del sistema es correcta, false de lo contrario
 */
const giveToken = (password) => {
  if (password === process.env.password) {
    return jwt.sign({ msg: "Usuario autenticado" }, process.env.SECRET);
  } else {
    return false;
  }
};

/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
exports.handler = async (event, context) => {
  //console.log('Received event:', JSON.stringify(event, null, 2));

  let body;
  let statusCode = "200";
  const headers = {
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "POST") {
    if (event.password === undefined || event.password.lenght === 0) {
      statusCode = "400";
      body = JSON.stringify({
        msg: "System password not found",
      });
    } else {
      const token = giveToken(event.password);
      body = JSON.stringify({
        token: token,
      });
    }
  } else {
    statusCode = "400";
    body = JSON.stringify({
      msg: "Operation not valid",
    });
  }

  return {
    statusCode,
    body,
    headers,
  };
};
