const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const Validator = require("jsonschema").Validator();
const dynamo = new AWS.DynamoDB.DocumentClient();

// Cargar las variables en el entorno usando el .env en el entorno personal
const dotenv = require("dotenv").config();

// Configurar el validador de esquemas
const validatorSchema = new Validator();

// Configurar el esquema
const schema = {
  email: { type: "string", format: "email" },
  uuid: { type: "string", format: "uuid" },
  description: { type: "string", minLength: 1, maxLength: 256 },
  required: ["email", "uuid", "description"],
};

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

  if (
    event.headers.Authorization === undefined ||
    event.headers.Authorization.lenght === 0
  ) {
    statusCode = "403";
    body = JSON.stringify({
      msg: "Please provide a token",
    });
    return {
      statusCode,
      body,
      headers,
    };
  }

  const token = event.headers.Authorization.split("Bearer")[0].trim();

  if (!verifyToken(token)) {
    statusCode = "403";
    body = JSON.stringify({
      msg: "Invalid token provided",
    });
    return {
      statusCode,
      body,
      headers,
    };
  }

  if (event.httpMethod === "POST") {
    // Consulta a la base de datos DynamoDB
    let reqBody = JSON.parse(event.body);

    // Validar el cuerpo de la peticion
    const isValid = validatorSchema.validate(reqBody, schema);

    if (!isValid.valid) {
      // Reportar errores.
      let errors = isValid.errors.map((el) => `${el.name} - ${el.message}`);
      statusCode = "400";
      body = JSON.stringify({
        errors: errors,
      });
      return {
        statusCode,
        body,
        headers,
      };
    }

    // Agregar la IP
    let clientIp = event.headers["x-forwarded-for"];

    // Agregar la fecha
    let thisTime = new Date().toISOString();

    reqBody.ip = clientIp;
    reqBody.date = thisTime;

    // Wrapper a la DB
    let dbObject = {
      TableName: "listasnegras",
      Item: reqBody,
    };

    // Guardar el objeto
    body = await dynamo.put(dbObject).promise();
    body = JSON.stringify(body);
  } else if (event.httpMethod === "GET") {
    /**
    let paramEmail = event.queryStringParameters.email;
    let isValid = validatorSchema.validate(paramEmail, {
      type: "string",
      format: "email",
    });

    if (!isValid.valid) {
      // Reportar errores.
      let errors = isValid.errors.map((el) => `${el.name} - ${el.message}`);
      statusCode = "400";
      body = JSON.stringify({
        errors: errors,
      });
      return {
        statusCode,
        body,
        headers,
      };
    }
    */
    body = await dynamo.scan({ TableName: "listasnegras" }).promise();
    body = JSON.stringify(body);
  } else {
    statusCode = "400";
    body = `Unsupported method ${event.httpMethod}`;
  }

  return {
    statusCode,
    body,
    headers,
  };
};
