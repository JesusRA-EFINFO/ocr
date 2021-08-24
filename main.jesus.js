require("dotenv/config");
const fs = require("fs");
const fsPromises = fs.promises;
const PATH = require("path");

const OCR = require("./ocr");
const IMAGES = require("./images");
const DATABASE = require("./database");
const OCRDB = require("./ocrDB");
const OCRSOLR = require("./ocrSolr");
const { dir } = require("console");
const PDFTK = require("./PDFTK");

const tempPath = `./tmp`;
const { morsaaDBconfig, solrconfig, generatedPDFSPath } = getEnvVars();
// const db = new DATABASE(morsaaDBconfig);
main();

async function main() {

  const files = await fsPromises.readdir(tempPath);
  const pdfFiles = files.filter((file) => PATH.extname(file) === ".pdf");
  for (let i = 0; i < pdfFiles.length; i++) {
    try {
      const pdfPath = `${tempPath}/${pdfFiles[i]}`;
      const pdfName = pdfFiles[i].split(".")[0];
      const workDirectory = `${tempPath}/${pdfName}/`;

      if (!fs.existsSync(workDirectory)) {
        fs.mkdirSync(workDirectory);
      }

      await IMAGES.convert(pdfPath, workDirectory);
      await IMAGES.makeTiffFromImages(pdfName, workDirectory);
      await OCR.makePDFTextFromTiff(pdfName, workDirectory);
      await PDFTK.makeSearchablePDF(pdfName, workDirectory, pdfPath)
      moveSearchablePDF(workDirectory, generatedPDFSPath, pdfFiles[i]);

      let pdfText = await OCR.recognize(`${workDirectory}/${pdfName}.tiff`);

      pdfText = pdfText.replace(/'/g, " ");
      pdfText = pdfText.replace(/\r?\n|\r/g, " ");
      /* Inserción en DB y Solr
      await OCRDB.insertDb(db, dirName, pdfText);
      const doc = await OCRSOLR.insertSolr(solrconfig, dirName, pdfText);
      if (doc.error) {
        console.log(
          `No se guardo el documento en solr ${pdfFiles[i]} -> ${doc.error.msg}`
        );
      }
      */

      fs.unlinkSync(pdfPath);
      fs.rmdirSync(workDirectory, { recursive: true })

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

  if(!process.env.GENERATED_PDFS_PATH){
    throw new Error("Falta difinir la variable de entorno GENERATED_PDFS_PATH");
  }

  const generatedPDFSPath = process.env.GENERATED_PDFS_PATH;

  return { morsaaDBconfig, solrconfig, generatedPDFSPath };
}

function moveSearchablePDF(source, destination, file){
  
    fs.rename(`${source}/${file}`, `${destination}/${file}`, (error) => {
      if(error){
        console.log(`Error al mover el archivo ${file} de ${source} a ${destination}`)
      }
    })

}
