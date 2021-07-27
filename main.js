require("dotenv/config");
const fs = require("fs");
const fsPromises = fs.promises;
const PATH = require("path");

const OCR = require("./ocr");
const IMAGES = require("./images");
const DATABASE = require("./database");
const OCRDB = require("./ocrDB");
const OCRSOLR = require("./ocrSolr");

const tempPath = `./tmp`;
const { morsaaDBconfig, solrconfig } = getEnvVars();
const db = new DATABASE(morsaaDBconfig);
main();

async function main() {
  const files = await fsPromises.readdir(tempPath);
  const pdfFiles = files.filter((file) => PATH.extname(file) === ".pdf");
  for (let i = 0; i < pdfFiles.length; i++) {
    try {
      const filePath = `${tempPath}/${pdfFiles[i]}`;

      const dirName = pdfFiles[i].split(".")[0];
      if (!fs.existsSync(`${tempPath}/${dirName}/`)) {
        fs.mkdirSync(`${tempPath}/${dirName}/`);
      }

      const outPath = `${tempPath}/${dirName}/`;
      await IMAGES.convert(filePath, outPath);

      const imagePaths = await fsPromises.readdir(outPath);
      let ocrText = "";
      for (let j = 0; j < imagePaths.length; j++) {
        ocrText += " " + (await OCR.recognize(`${outPath}/${imagePaths[j]}`));
        fs.unlinkSync(`${outPath}/${imagePaths[j]}`);
      }
      //Para hacer el tesseract de forma asincrona
      /*const imagesPromises = imagePaths.map(async (imagePath) => {
        const text = await OCR.recognize(`${outPath}/${imagePath}`);
        fs.unlinkSync(`${outPath}/${imagePath}`);
        return text;
      });

      const texts = await Promise.all(imagesPromises);
      let ocrText = texts.toString();*/
      fs.rmdirSync(outPath);
      ocrText = ocrText.replace(/'/g, " ");
      ocrText = ocrText.replace(/\r?\n|\r/g, " ");
      await OCRDB.insertDb(db, dirName, ocrText);
      const doc = await OCRSOLR.insertSolr(solrconfig, dirName, ocrText);
      if (doc.error) {
        console.log(
          `No se guardo el documento en solr ${pdfFiles[i]} -> ${doc.error.msg}`
        );
      }
      fs.unlinkSync(filePath);
    } catch (error) {
      console.log(`Error en el archivo ${pdfFiles[i]} -> ${error.message}`);
    }
  }

  setTimeout(() => {
    main();
  }, 1000);
}
function getEnvVars() {
  if (
    !process.env.MORSAA_MYSQL_HOST ||
    !process.env.MORSAA_MYSQL_USER ||
    //!process.env.MORSAA_MYSQL_PASSWORD ||
    !process.env.MORSAA_MYSQL_DATABASE
  ) {
    throw new Error(
      "Falta definir las variables de entorno MORSAA_MYSQL_HOST, MORSAA_MYSQL_USER, MORSAA_MYSQL_PASSWORD y MORSAA_MYSQL_DATABASE en .env"
    );
  }

  const morsaaDBconfig = {
    host: process.env.MORSAA_MYSQL_HOST,
    user: process.env.MORSAA_MYSQL_USER,
    password: process.env.MORSAA_MYSQL_PASSWORD,
    database: process.env.MORSAA_MYSQL_DATABASE,
    port: process.env.MORSAA_MYSQL_PORT
      ? parseInt(process.env.MORSAA_MYSQL_PORT, 10)
      : 3306,
  };

  if (!process.env.SOLR_HOST || !process.env.SOLR_PORT) {
    throw new Error(
      "Falta definir las variables de entorno SOLR_HOST, SOLR_PORT en .env"
    );
  }

  const solrconfig = {
    host: process.env.SOLR_HOST,
    port: process.env.SOLR_PORT,
  };

  return { morsaaDBconfig, solrconfig };
}
