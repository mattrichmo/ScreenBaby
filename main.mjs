import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData, parseLinesCharData } from './components/CleanUtils.mjs';
import { parseScenes, cleanScenes, updateSceneHeaders } from './components/ParseUtils.mjs';
import chalk from 'chalk';
import express from 'express';

// ************************************************************

export const PDF_FILE = './scripts/scriptsmall.pdf'; // Define the PDF_FILE constant here

// ************************************************************


const docRaw = {
  pdfRaw: {},
  pagesJSONRaw: [],
  pdfRawText: [{}],
  pagesRaw: [
    {
      pageIndex: 0,
      pageID: '',
      pageRawText: '',
      pageLines: [['']],
      pageLineChars: [[['']]],
    },
  ],
  rawTextJSONArray: [{}],
  combinedChar: [{}],
  combinedCharLines:{
    lineText: '',
    sceneHeaderLine: 0,  // boolean for scene header. if line starts with INT. or EXT. or INT/EXT or EXT/INT then sceneHeader = 1
    importantLine: 0, // boolean for important line. If the line includes any word longer than 2 letters that is full caps, then importantLine = 1
    lineChars: [{}]
  },
};

const sceneParse = {
  scenes: [{
    heading: {
        index: 0,
      page: 0,
      context: "",
      setting: "",
      sequence: "",
      prodSceneNum: "",
    },
    sceneID: "uuidv4()",
      sceneTitle: '',
      bodyRaw: '',
      body: [],
      lines: [{
        lineID: "uuidv4()",
          lineText: '',
          sceneHeaderLine: 0,  // boolean for scene header. if line starts with INT. or EXT. or INT/EXT or EXT/INT then sceneHeader = 1
          importantLine: 0, // boolean for important line. If the line includes any word longer than 2 letters that is full caps, then importantLine = 1
          lineNumber: null,
          lineChars: [
            {
              text: '',
              charID: "uuidv4()",
              x: null,
              y: null,
              w: null,
              clr: null,
              sw: null,
            },
          ],
        }],
        linesCleaned: [{
            lineID: "uuidv4()",
              lineText: '',
              sceneHeaderLine: 0,  // boolean for scene header. if line starts with INT. or EXT. or INT/EXT or EXT/INT then sceneHeader = 1
              importantLine: 0, // boolean for important line. If the line includes any word longer than 2 letters that is full caps, then importantLine = 1
              lineNumber: null,
              lineChars: [
                {
                  text: '',
                  charID: "uuidv4()",
                  x: null,
                  y: null,
                  w: null,
                  clr: null,
                  sw: null,
                },
              ],
            }],
      
    },
  ],
};

const scriptCharacters = [{
  text: '',
  sceneLocations: [{
    id: '', // uuid
    index: 0, // scene index
  }],
}]









const initialLoad = async () => {

  await loadPDF(docRaw);
  await readPDFToJson(docRaw);
  await createCharObjects(docRaw);
  await combineCharData(docRaw);
  
};

const parseScenesToObject = async (docRaw, sceneParse) => {
   
    await parsePageLinesCharData(docRaw);
    await parseLinesCharData(docRaw);
    await parseScenes(docRaw, sceneParse);
    await cleanScenes(sceneParse);
    await updateSceneHeaders(sceneParse);


};

const extractScriptCharacters = (sceneParse, scriptCharacters) => {
  sceneParse.scenes.forEach((scene, sceneIndex) => {
      scene.linesCleaned.forEach((line, lineIndex) => {
          const lineText = line.lineText.trim();
          const words = lineText.split(/\s+/);

          if (words.length === 1 && /^[A-Z]+$/.test(words[0])) {
              const capitalWord = words[0];

              const existingCharacterIndex = scriptCharacters.findIndex(character => character.text === capitalWord);

              if (existingCharacterIndex !== -1) {
                  const existingSceneIndex = scriptCharacters[existingCharacterIndex].sceneLocations.findIndex(sceneLoc => sceneLoc.index === sceneIndex);
                  if (existingSceneIndex === -1) {
                      scriptCharacters[existingCharacterIndex].sceneLocations.push({
                          id: scene.sceneID,
                          index: sceneIndex
                      });
                  }
              } else {
                  scriptCharacters.push({
                      text: capitalWord,
                      sceneLocations: [{
                          id: scene.sceneID,
                          index: sceneIndex
                      }]
                  });
              }
          }
      });
  });

  // Remove the first object in the array if it exists
  if (scriptCharacters.length > 0) {
      scriptCharacters.shift();
  }

  return scriptCharacters; // Return the updated scriptCharacters array
};



const main = async (docRaw, sceneParse, scriptCharacters) => {
  await initialLoad();
  await parseScenesToObject(docRaw, sceneParse);
  await extractScriptCharacters(sceneParse, scriptCharacters); 
  // Create an Express.js app
  const app = express();

  // Define a route that responds with the sceneParse object as JSON
  app.get('/api/sceneParse', (req, res) => {
    res.json(sceneParse);
  });

  // Start the server
  app.listen(3000, () => {
    console.log('Server is running on port 3000. Link: http://localhost:3000/api/sceneParse');
  });
  
  console.log(chalk.bold.blue('Parsed scene information:\n'));
  //console.log(chalk.gray(JSON.stringify(sceneParse, null, 2)));

  const linesCleaned = [];
  sceneParse.scenes.forEach((scene, sceneIndex) => {
      const hiddenLinesCount = scene.lines.length - scene.linesCleaned.length; // Calculate the hidden lines count

      console.log(chalk.bold.green(`\nSC${sceneIndex + 1}: ${chalk.underline(scene.sceneTitle)}`));
      console.log();
      console.log(chalk.cyan('Scene Context:'), scene.heading.context);
      console.log(chalk.cyan('Scene Setting:'), scene.heading.setting);
      console.log(chalk.cyan('Scene Sequence:'), scene.heading.sequence);
      console.log(chalk.cyan('Prod Scene #'), scene.heading.prodSceneNum);

      console.log(chalk.yellow('\nScene Lines:\n'));
      scene.linesCleaned.forEach((line, lineIndex) => { // Use linesCleaned instead of lines
          console.log(chalk.dim(`${lineIndex + 1} |`), chalk.white(line.lineText));
      });

      if (hiddenLinesCount > 0) {
          console.log(chalk.red('\n Cleaned Lines:'), hiddenLinesCount);
      }

      console.log(chalk.dim.gray('\n' + '-'.repeat(60) + '\n'));
  });
  scriptCharacters.forEach((character, characterIndex) => {
    console.log(chalk.dim(`Character ${characterIndex + 1}:`), chalk.cyan(character.text));
    character.sceneLocations.forEach((sceneLoc, locIndex) => {
        console.log(chalk.dim(`Scene: ${sceneLoc.index}, ID: ${sceneLoc.id}, `));
    });
});
console.log(chalk.dim.gray('-'.repeat(60) + '\n'));

};

main(docRaw, sceneParse, scriptCharacters); 
