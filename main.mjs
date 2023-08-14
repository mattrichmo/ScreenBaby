import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import chalk from 'chalk';


const docRaw = {
    pdfRaw: {},
    pagesJSONRaw: [],
    pdfRawText: [{}],
    pagesRaw: [{
        pageRawText: "",
        pageLines: [[""]],
        pageLineChars: [[['']]]
        }],
    rawTextJSONArray : [{}],
    combinedChar: [{}],

};



const createCharObjects = (docRaw) => {
  const pdfRawText = docRaw.text;
  const pdfRawTextChars = docRaw.pdfRaw.text.split('');
  const pdfRawTextObjects = pdfRawTextChars.map((char) => {
    return {
      text: char,
      x: null,
      y: null,
      w: null,
      clr: null,
      sw: null,
      A: '',
    };
  });
  docRaw.pdfRawText = pdfRawTextObjects;
  return pdfRawTextObjects;
};

const combineCharData = (docRaw) => {
    const combinedData = [];
    let jsonIndex = 0;
  
    for (const charObj of docRaw.pdfRawText) {
      if (charObj.text.trim() === '' || charObj.text === '\n') {
        combinedData.push(charObj);
      } else if (jsonIndex < docRaw.rawTextJSONArray.length) {
        combinedData.push({
          ...docRaw.rawTextJSONArray[jsonIndex],
          text: charObj.text,
        });
        jsonIndex++;
      } else {
        combinedData.push(charObj);
      }
    }
  
    docRaw.combinedChar = combinedData;
};

const parsePagesandLines = (docRaw) => {
    const pages = docRaw.pdfRaw.text.split(/\r?\n\n/);
    docRaw.pagesRaw = pages.map((pageRawText, pageIndex) => {
        const lines = pageRawText.split(/\r?\n/);
        const pageLines = lines.map((line, lineNumber) => {
            const lineChars = line.split('').map((char) => ({ text: char }));
            return {
                lineNumber: lineNumber + 1,
                lineText: line,
                lineChars: lineChars,
            };
        });

        return {
            pageIndex: pageIndex + 1,
            pageRawText: pageRawText,
            pageLines: pageLines,
        };
    });
};
const parsePageLinesCharData = (docRaw) => {
    const charArray = docRaw.combinedChar.map(charObj => charObj.text);
    const pages = charArray.join('').split(/\r?\n\n/);

    docRaw.pagesRaw = pages.map((pageRawText, pageIndex) => {
        const lines = pageRawText.split(/\r?\n/);
        const pageLines = lines.map((line, lineNumber) => {
            const lineChars = line.split('').map((char) => {
                const charObj = docRaw.combinedChar.find(obj => obj.text === char);
                return charObj ? charObj : { text: char };
            });
            return {
                lineNumber: lineNumber + 1,
                lineText: line,
                lineChars: lineChars,
            };
        });

        return {
            pageIndex: pageIndex + 1,
            pageRawText: pageRawText,
            pageLines: pageLines,
        };
    });
};

const initialLoad = async () => {
    await loadPDF(docRaw);
    await readPDFToJson(docRaw);
    await createCharObjects(docRaw);
    await combineCharData(docRaw);
    //await parsePagesandLines(docRaw);
    await parsePageLinesCharData(docRaw);
    //console.log('docRaw.pagesRaw',docRaw.pagesRaw );

    //console.log('docRaw.pagesRaw', JSON.stringify(docRaw.pagesRaw, null, 2));
docRaw.pagesRaw.forEach((page) => {
  console.log(chalk.red(`Page ${page.pageIndex}:`));
  page.pageLines.forEach((line) => {
    console.log(`${chalk.dim(line.lineNumber)}: ${chalk.white(line.lineText)}`);
    console.log(chalk.dim('char count:', line.lineChars.length));
  });
});
};



initialLoad();

  
  