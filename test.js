//tesseract: https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-v4.1.0.20190314.exe
//imagemagick: https://download.imagemagick.org/ImageMagick/download/binaries/ImageMagick-7.1.0-4-Q16-HDRI-x64-dll.exe
//ghost: https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs9540/gs9540w64.exe
//pdftk: https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/pdftk_free-2.02-win-setup.exe
//pdftk Linux: RUN apt-get install -y pdftk

//El servicio se mantiene corriendo indefinidamente, para que el texto de un pdf sea reconocido se debe agregar a la carpeta /tmp y automáticamente generará el texto y lo pintará dentro de la consola. Al final de la ejecución el pdf será eliminado, igual que todos los temporales creados durante el proceso.
//El imagemagick convert se ejecuta de manera síncrona va pdf por pdf. El tesseract lo genera de forma simultanea varias imagenes a la vez.

/*console.time("imagenes");
im.convert(
  [
    "-verbose",
    "-density",
    "220",
    "-trim",
    `${inputFilePath}.pdf`,
    "-colorspace",
    "gray",
    "-resize",
    "900x",
    "-quality",
    "100",
    "-coalesce",
    "-sharpen",
    "0x1.0",
    `${resultDir}${nameOutput}-%03d.jpg`,
  ],
  function (err, stdout) {
    if (err) throw err;
    console.timeEnd("imagenes");
  }
);*/
/*Leer directorio de imagenes y tesseract*/
/*console.time("tesseract");
const config = {
  lang: "spa",
  oem: 1,
  psm: 3,
};
fs.readdir(resultDir, function (err, files) {
  if (err) {
    onError(err);
    return;
  }
  files.map(function (file) {
    console.log(file);
    tesseract
      .recognize(resultDir + file, config)
      .then((text) => {
        //console.log("Result:", text);
        //console.timeEnd("tesseract");
        const textResultFilePath = `tmp/txt/${file}.txt`;
        const fullTextResultFilePath = `tmp/txt/${inputFilePath}-FULLTEXT.txt`;
        fs.writeFileSync(textResultFilePath, text);
        if (!fs.existsSync(fullTextResultFilePath)) {
          fs.writeFileSync(fullTextResultFilePath, "");
        }
        fs.appendFileSync(fullTextResultFilePath, `${text}\n\n`);
      })
      .catch((error) => {
        console.log(error.message);
      });
    return "Response";
  });
});
*/
