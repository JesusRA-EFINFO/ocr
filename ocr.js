const tesseract = require("node-tesseract-ocr");
const { exec } = require("child_process")

const tesseractConfig = {
  lang: "spa",
  oem: 1,
  psm: 3,
};

class OCR {
  static async recognize(path) {
    return tesseract.recognize(path, tesseractConfig);
  }

  static makePDFTextFromTiff(pdfName, outputPath){
    return new Promise((resolve, reject) => {

      exec(`tesseract ${outputPath}/${pdfName}.tiff ${outputPath}/${pdfName}Text -l spa -c textonly_pdf=1 pdf`, error => {
        if(error) reject(error)
        resolve()
      })

    })
  }
  
}

module.exports = OCR;
