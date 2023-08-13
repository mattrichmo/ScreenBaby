import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';


const docRaw = {
    pdfRaw: {},
    pagesJSONRaw: [],
    pdfRawText: [{}],
    pagesRaw: [{
        pageRawText: "",
        pageLines: [[""]],
        lineChars: [[{}]],
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
    const fullText = docRaw.combinedChar.map(charObj => charObj.text).join('');
    const pages = fullText.split('\n\n').map(pageText => {
      const lines = pageText.split('\n').map(lineText => {
        const lineChars = [];
        for (const char of lineText) {
          lineChars.push(docRaw.combinedChar.find(charObj => charObj.text === char));
        }
        return lineChars;
      });
      return lines;
    });
  
    docRaw.pagesRaw = pages;
  };
  
  
  
  
  
  
  
  

  const initialLoad = async () => {
    await loadPDF(docRaw);
    await readPDFToJson(docRaw);
    await createCharObjects(docRaw);
    await combineCharData(docRaw);
    await parsePagesandLines(docRaw); // Call the new function here
    //console.log('Combined Data:', JSON.stringify(docRaw.combinedChar, null, 2));
    //console.log('docRaw.rawTextJSONArray:', docRaw.rawTextJSONArray);
    //console.log('pdfRawText:', docRaw.pdfRawText);
    console.log('docRaw.pagesRaw:', docRaw.pagesRaw);
    console.log('docRaw.rawTextJSONArray Length:', docRaw.rawTextJSONArray.length);
    console.log('pdfRawText Length:', docRaw.pdfRawText.length);
    console.log('Combined Data:', docRaw.combinedChar.length);

  };
  

  initialLoad();