class OCRDB {
  static async insertDb(db, idDoc, ocr) {
    const pool = db.getPool();
    let query = `UPDATE document SET content= ? WHERE id = ?`;
    await pool.query(query, [ocr, idDoc]);
  }

  close() {
    this.pool.end();
  }
}

module.exports = OCRDB;
