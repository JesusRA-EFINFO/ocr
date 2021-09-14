require("dotenv/config");
const fs = require("fs");
const fsPromises = fs.promises;
const PATH = require("path");

const OCR = require("./ocr");
const IMAGES = require("./images");
const DATABASE = require("./database");
const OCRDB = require("./ocrDB");
const OCRSOLR = require("./ocrSolr");
const PDF = require("./pdf");
const { exit } = require("process");

const tempPath = `./tmp`;
const { morsaaDBconfig, solrconfig, generatedPDFSPath } = getEnvVars();
const db = new DATABASE(morsaaDBconfig);
main();

async function main() {

  const files = await fsPromises.readdir(tempPath);
  const pdfFiles = files.filter((file) => PATH.extname(file) === ".pdf");
  const TIMEOUT = process.env.TIMEOUT || null

  for (let i = 0; i < pdfFiles.length; i++) {

    const pdfPath = `${tempPath}/${pdfFiles[i]}`;
    const pdfName = pdfFiles[i].split(".")[0];
    const workDirectory = `${tempPath}/${pdfName}/`;
    try {
      // let document = await OCRDB.get(db, pdfName);
      // const folderFinalFile = getFinalPath(
      //   document[0].create_time,
      //   document[0].hash
      // );

      if (!fs.existsSync(workDirectory)) {
        fs.mkdirSync(workDirectory);
      }

      const pdfHasBeenSplitted = await PDF.splitPdf(pdfPath, workDirectory)

      if(pdfHasBeenSplitted){

        const workDirectoryFiles = await fsPromises.readdir(workDirectory)
        const splittedFiles = workDirectoryFiles.filter( file => PATH.extname(file) === ".pdf")
                                    
        for(const splittedFile of splittedFiles){

          const splittedPdfName = splittedFile.replace('.pdf', '')
          const pdfTmpDir = `${ workDirectory }/${ splittedPdfName }`
          if (!fs.existsSync(pdfTmpDir)) {
            fs.mkdirSync(pdfTmpDir);
          }

          await IMAGES.convert(`${ workDirectory }/${ splittedFile }`, pdfTmpDir)
          await IMAGES.makeTiffFromImages(splittedPdfName, pdfTmpDir, workDirectory)
          await OCR.makePDFTextFromTiff(splittedPdfName, workDirectory)
          await PDF.makeSearchablePDF(splittedPdfName, workDirectory, `${ workDirectory }/${ splittedFile }`)

          removeTempData(`${ workDirectory }/${ splittedPdfName }Text.pdf`, pdfTmpDir)

        }

        const splittedFilesPath = splittedFiles.map( splittedFile => `${ workDirectory }/${ splittedFile }`)
        await PDF.mergePDF(splittedFilesPath, pdfName, workDirectory)

      }else{
        await IMAGES.convert(pdfPath, workDirectory)
        await IMAGES.makeTiffFromImages(pdfName, workDirectory, workDirectory)
        await OCR.makePDFTextFromTiff(pdfName, workDirectory)
        await PDF.makeSearchablePDF(pdfName, workDirectory, pdfPath)
      }

      moveSearchablePDF(
        workDirectory,
        generatedPDFSPath,
        pdfFiles[i],
        // folderFinalFile
        pdfFiles[i]
      );

      const workDirectoryFiles = await fsPromises.readdir(workDirectory)
      const tiffFilePaths = workDirectoryFiles
                              .filter( file => PATH.extname(file) === '.tiff' )
                              .map( tiffFile => `${ workDirectory }/${ tiffFile }`)

      let pdfText = await tiffFilePaths.reduce( async (textAccumulator, tiffFile) => {

        let tiffText = await textAccumulator

        tiffText += ` ${ await OCR.recognize(tiffFile) }`

        fs.unlinkSync(tiffFile)

        return tiffText

      }, '')

      pdfText = pdfText.replace(/'/g, " ");
      pdfText = pdfText.replace(/\r?\n|\r/g, " ");

      // await OCRDB.insertDb(db, pdfName, pdfText);
      // const doc = await OCRSOLR.insertSolr(solrconfig, pdfName, pdfText);
      // if (doc.error) {
      //   console.log(
      //     `No se guardo el documento en solr ${pdfFiles[i]} -> ${doc.error.msg}`
      //   );
      // }

    } catch (error) {

      console.log(`Error en el archivo ${pdfFiles[i]} -> ${error.message}`);

    } finally{
      
      removeTempData(pdfPath, workDirectory)

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

  if (!process.env.GENERATED_PDFS_PATH) {
    throw new Error("Falta difinir la variable de entorno GENERATED_PDFS_PATH");
  }

  const generatedPDFSPath = process.env.GENERATED_PDFS_PATH;

  return { morsaaDBconfig, solrconfig, generatedPDFSPath };
}

function getFinalPath(date, hash) {
  documentDate = new Date(date);
  year = documentDate.getFullYear();
  month = ("0" + (documentDate.getMonth() + 1)).slice(-2);
  date = ("0" + documentDate.getDate()).slice(-2);
  return year + "/" + month + "/" + date + "/" + hash + ".pdf";
}

function moveSearchablePDF(source, destination, file, finalName) {
  fs.rename(`${source}/${file}`, `${destination}/${finalName}`, (error) => {
    if (error) {
      console.log(
        `Error al mover el archivo ${file} de ${source} a ${destination}`
      );
    }
  });
}

function removeTempData(pdfPath, workDirectory){

  fs.unlinkSync(pdfPath);
  fs.rmdirSync(workDirectory, { recursive: true });

}