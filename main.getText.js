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
const { exit, mainModule } = require("process");

const tempPath = `./tmp`;
const { morsaaDBconfig, solrconfig, generatedPDFSPath } = getEnvVars();
const db = new DATABASE(morsaaDBconfig);
main();

async function main() {

  const pdfFiles = await getFiles( tempPath, '.pdf' )
  const TIMEOUT = Number(process.env.TIMEOUT) || null

  for (const pdf of pdfFiles) {

    cleanMagickTmpDir()

    const pdfName = pdf.replace('.pdf', '')
    const pdfPath = `${ tempPath }/${ pdf }`;
    const workDirectory = `${ tempPath }/${ pdfName }`;

    try {

      await executeProcessPDF(pdfName, pdfPath, workDirectory, TIMEOUT)

    } catch (error) {

      console.log(`Error en el archivo ${ pdf } -> ${ error.message }`);

    } finally {
      
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

async function getFiles(directory, extension){

  const files = await fsPromises.readdir(directory)
  return files.filter( file => PATH.extname(file) === extension )

}

async function processPDF(pdfName, pdfPath, workDirectory){
 
  let pdfText = ''

  if (!fs.existsSync(workDirectory)) {
    fs.mkdirSync(workDirectory);
  }

  const pdfHasBeenSplitted = await PDF.splitPdf(pdfPath, workDirectory, 100)

  if(pdfHasBeenSplitted){

    const splittedFiles = await getFiles( workDirectory, '.pdf' )
                                
    for(const splittedFile of splittedFiles){

      const splittedPdfName = splittedFile.replace('.pdf', '')
      const splittedPdfPath = `${ workDirectory }/${ splittedFile }`          
      const pdfTmpDir = `${ workDirectory }/${ splittedPdfName }`

      if (!fs.existsSync(pdfTmpDir)) {
        fs.mkdirSync(pdfTmpDir);
      }

      await IMAGES.convert(splittedPdfPath, pdfTmpDir);

      const tmpDirImages = await fsPromises.readdir(pdfTmpDir)
      const splittedFileText = await tmpDirImages
                                .map( image => `${ pdfTmpDir }/${ image }` )
                                .reduce( async (textAccumulator, imagePath) => {
                                  const imageText = await textAccumulator
                                  const ocrImage = await OCR.recognize(imagePath)
                                  fs.unlinkSync(imagePath)

                                  return `${imageText} ${ocrImage}`
                                }, '')

      pdfText += splittedFileText
      
      removeTempData(splittedPdfPath, pdfTmpDir)

    }

  }else{

    await IMAGES.convert(pdfPath, workDirectory)

    const images = await getFiles( workDirectory, '.jpg')

    pdfText = await images
      .map( image => `${ workDirectory }/${ image }` )
      .reduce( async (textAccumulator, imagePath) => {
        const imageText = await textAccumulator
        const ocrImage = await OCR.recognize(imagePath)
        fs.unlinkSync(imagePath)

        return `${imageText} ${ocrImage}`
      }, '')

  }

  pdfText = pdfText.replace(/'/g, " ");
  pdfText = pdfText.replace(/\r?\n|\r/g, " ");

  // await OCRDB.insertDb(db, pdfName, pdfText);
  // const doc = await OCRSOLR.insertSolr(solrconfig, pdfName, pdfText);
  // if (doc.error) {
  //   console.log(
  //     `No se guardo el documento en solr ${pdfFiles[i]} -> ${doc.error.msg}`
  //   );
  // }

}

function executeProcessPDF(pdfName, pdfPath, workDirectory, timeout = null){

  return new Promise( async (resolve, reject) => {

    if(timeout){
      setTimeout( reject, timeout, Error(`Se alcanzó el tiempo máximo de proceso: ${ timeout } segundos`) )
    }

    resolve( await processPDF(pdfName, pdfPath, workDirectory) )

  })
}

function cleanMagickTmpDir(){
  fs.readdirSync( process.env.MAGICK_TMPDIR )
    .forEach( tempFile => fs.unlinkSync(`${ process.env.MAGICK_TMPDIR }/${ tempFile }`) )
}