import fs from 'fs';
import pdf from 'pdf-parse';
import PDFParser from 'pdf2json';

const pdf2JSON = {
    rawTextJSONArray : [{
    }]
};


const PDF_FILE = './scripts/scriptxsmall.pdf';

export const loadPDF = async (docRaw) => {
    try {
        const dataBuffer = fs.readFileSync(PDF_FILE);
        const pdfData = await pdf(dataBuffer);
        docRaw.pdfRaw = pdfData;
    } catch (error) {
        console.error("Error loading PDF file: ", error);
    }
}
export const readPDFToJson = async (docRaw) => {
  try {
    const pdfParser = new PDFParser();
    const pdfBuffer = await fs.promises.readFile(PDF_FILE);

    return new Promise((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', errData => {
        console.error(errData.parserError);
        reject(errData.parserError);
      });
      pdfParser.on('pdfParser_dataReady', jsondata => {
        const pdfJsonRaw = jsondata.Pages.flatMap(page => {
          return page.Texts.flatMap(text => {
            return text.R.flatMap(r => {
              return r.T.split('').map(char => {
                return {
                  text: char,
                  x: text.x,
                  y: text.y,
                  w: text.w,
                  clr: text.clr,
                  sw: text.sw,
                  A: text.A,
                };
              });
            }).map(char => {
              char.x += text.x;
              char.y += text.y;
              return char;
            });
          });
        });
        docRaw.pagesJSONRaw = jsondata.Pages;
        //console.log('pagesJSONRaw.Texts:', docRaw.pagesJSONRaw[0].Texts);
        docRaw.rawTextJSONArray = pdfJsonRaw;

        resolve();
      });

      pdfParser.parseBuffer(pdfBuffer);
    });
  } catch (error) {
    console.error('Error: ', error);
  }
};
