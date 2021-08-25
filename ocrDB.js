class OCRDB {
  static async insertDb(db, idDoc, ocr) {
    const pool = db.getPool();
    let query = `UPDATE DOCUMENT SET content= ? WHERE id = ?`;
    await pool.query(query, [ocr, idDoc]);
  }
  static async get(db, idDoc) {
    const pool = db.getPool();
    let query = `SELECT * FROM DOCUMENT WHERE id = ?`;
    const [rows] = await pool.query(query, [idDoc]);
    return rows;
  }

  close() {
    this.pool.end();
  }
}

module.exports = OCRDB;
