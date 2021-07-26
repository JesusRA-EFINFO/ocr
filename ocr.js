const tesseract = require("node-tesseract-ocr");

const tesseractConfig = {
  lang: "spa",
  oem: 1,
  psm: 3,
};

class OCR {
  static async recognize(path) {
    return tesseract.recognize(path, tesseractConfig);
  }
}

module.exports = OCR;
