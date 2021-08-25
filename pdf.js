const pdftk = require("node-pdftk");

class Pdf {
  static async makeSearchablePDF(pdfName, workDirectory, sourcePDFPath) {
    await pdftk
      .input(`${sourcePDFPath}`)
      .multiBackground(`${workDirectory}/${pdfName}Text.pdf`)
      .output(`${workDirectory}/${pdfName}.pdf`)
      .catch((error) => console.log(error));
  }
}

module.exports = Pdf;