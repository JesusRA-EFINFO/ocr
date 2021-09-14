const imagemagick = require("imagemagick");

class Images {
  static async convert(filePath, outPath) {
    return new Promise((resolve, reject) => {
      imagemagick.convert(
        [
          "-verbose",
          "-density",
          "220",
          "-trim",
          `${filePath}`,
          "-colorspace",
          "gray",
          "-resize",
          "900x",
          "-quality",
          "100",
          "-coalesce",
          "-sharpen",
          "0x1.0",
          `${outPath}/%03d.jpg`,
        ],
        (error) => {
          if (!error) {
            resolve();
          }
          reject(error);
        }
      );
    });
  }

  static makeTiffFromImages(pdfName, source, destination){
    return new Promise((resolve, reject) => {
      imagemagick.convert(
        [
          `${source}/*.jpg`,
          `${destination}/${pdfName}.tiff`,
        ],
        error => {
          if(error) reject(error)
          resolve(error)
        }
      )
    })
  }

}

module.exports = Images;