const pdftk = require("node-pdftk");

class Pdf {
  static async makeSearchablePDF(pdfName, workDirectory, sourcePDFPath) {
    await pdftk
      .input(`${sourcePDFPath}`)
      .multiBackground(`${workDirectory}/${pdfName}Text.pdf`)
      .output(`${workDirectory}/${pdfName}.pdf`)
      .catch((error) => console.log(error));
  }

  static async splitPdf(pdf, workDirectory, pagesPerPDF = 100){

    const pdfHasBeenSplitted = true

    const pdfData = await pdftk
      .input(pdf)
      .dumpDataUtf8()
      .output()
      .then(data => data.toString('utf8'))
      .catch(console.log)

    const numberOfPagesRegex = /(NumberOfPages: [0-9]+)/g
    const [ result ] = pdfData.match(numberOfPagesRegex)
    let [, numberOfPages ] = result.split(':')
    numberOfPages = parseInt(numberOfPages)

    if(numberOfPages < pagesPerPDF)
      return !pdfHasBeenSplitted;

    const pdfsToCreate = (numberOfPages % pagesPerPDF) > 0
                            ? Math.trunc(numberOfPages / pagesPerPDF) + 1
                            : Math.trunc(numberOfPages / pagesPerPDF)

    let begin = 0
    let end = 0
    for(let i = 1; i <= pdfsToCreate; i++){

      begin = end + 1
      end = i === pdfsToCreate ? 'end' : end + pagesPerPDF

      await pdftk
        .input(pdf)
        .cat(`${begin}-${end}`)
        .output(`${workDirectory}/${begin}-${end}.pdf`)
        .catch(console.log)

    }

    return pdfHasBeenSplitted

  }

  static async mergePDF(splittedFiles, pdfName, outputPath){

    await pdftk
      .input(splittedFiles)
      .cat()
      .output(`${outputPath}/${pdfName}.pdf`)
      .catch(console.log)

  }

}

module.exports = Pdf;
