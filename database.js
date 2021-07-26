const mysql = require("mysql2");

class DataBase {
  constructor({ host, user, password, database, port }) {
    const pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
    });
    this.pool = pool.promise();
  }

  getPool() {
    return this.pool;
  }
}

module.exports = DataBase;
