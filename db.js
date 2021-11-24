const Pool = require("pg").Pool;

const pool = new Pool({
    user: "lakeuser",
    password: "sys",
    database: "medas_datalake",
    host: "mock-datalake-db",
    port: 5432
});

module.exports = pool;