const fetch = require("node-fetch");
class OCRSOLR {
  static async insertSolr(solrConfig, docId, ocr) {
    const url = `http://${solrConfig.host}:${solrConfig.port}/solr/documentos/update?commit=true`;
    var query = [{ id: parseInt(docId), content: { set: ocr } }];
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(query),
    });
    const solrResponse = await response.json();
    return solrResponse;
  }
}

module.exports = OCRSOLR;
