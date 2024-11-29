const { Pool } = require("pg");
const { Signer } = require('@aws-sdk/rds-signer')


const signerOptions = {
  credentials: {
    accessKeyId: process.env.AWSACCESSKEY,
    secretAccessKey: process.env.AWSSECRETKEY
  },
  region: process.env.RDSDBREGION,
  hostname: process.env.RDSHOSTNAME,
  port: process.env.RDSDBPORT,
  username: process.env.RDSDBUSERNAME
}

const signer = new Signer()

const getPassword = async () => await signer.getAuthToken(signerOptions)




// const pool = new Pool({
//   user: signerOptions.username,
//   password: process.env.RDSPASSWORD,
//   host: signerOptions.hostname,
//   port: signerOptions.port,
//   database: process.env.RDSDBNAME,
//   ssl: {
//     rejectUnauthorized: false
//   }
// })

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pandoorbox",
  password: "!V1nzt3r91",
  port: 5432,
});

module.exports = {
  pool,
};
