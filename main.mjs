import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData, parseLinesCharData } from './components/CleanUtils.mjs';
import { parseScenes, cleanScenes, updateSceneHeaders, extractScriptCharacters } from './components/ParseUtils.mjs';
import chalk from 'chalk';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

// ************************************************************

export const PDF_FILE = './scripts/bb.pdf'; // Define the PDF_FILE constant here

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
    sceneIndex: 0,
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
    elements: [{
      elementID: 'uuid',
      parentScene: {
        sceneID: 'scene UUID',
        sceneIndex: 0,
        sceneTitle: 'sceneparse.sceneTitle',
        sceneLineIndex: 0,
      },
      type: '', // type of action, character, dialogue, general, parenthetical, shot, transition
      elementRawLines : [],
      dual: 0 // boolean value. is 1 if multiple dialogue are present in the lines before or after 
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
}];
const parseElements = async (sceneParse) => {
  sceneParse.scenes.forEach((scene) => {
    scene.elements = []; // Initialize the elements array for each scene

    let currentElement = null;

    scene.linesCleaned.forEach((line) => {
      if (line.lineText.match(/[A-Z][A-Z]+/)) {
        if (currentElement) {
          scene.elements.push(currentElement); // Push the current element to the elements array of the scene
        }
        currentElement = {
          elementID: uuidv4(),
          parentScene: {
            sceneID: scene.sceneID,
            sceneIndex: sceneParse.scenes.indexOf(scene),
            sceneTitle: scene.sceneTitle,
            sceneLineIndex: scene.linesCleaned.indexOf(line),
          },
          type: '',
          elementRawLines: [],
          dual: 0,
        };
      }

      if (currentElement) {
        currentElement.elementRawLines.push(line);
      }
    });

    if (currentElement) {
      scene.elements.push(currentElement); // Push the last element to the elements array of the scene
    }
  });

  return sceneParse;
};

const startServer = async (sceneParse) => {
 const app = express();

  // Define a route that responds with the sceneParse object as JSON
  app.get('/api/sceneParse', (req, res) => {
    res.json(sceneParse);
  });

  // Start the server
  app.listen(3000, () => {
    console.log('Server is running on port 3000. Link: http://localhost:3000/api/sceneParse');
  });
};


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
const main = async (docRaw, sceneParse, scriptCharacters) => {
  await initialLoad();
  await parseScenesToObject(docRaw, sceneParse);
  await extractScriptCharacters(sceneParse, scriptCharacters); 
  await parseElements(sceneParse);
  console.log('screens', JSON.stringify(sceneParse));

  console.log(chalk.bold.blue('Parsed scene information:\n'));

  sceneParse.scenes.forEach((scene, sceneIndex) => {
    const hiddenLinesCount = scene.lines.length - scene.linesCleaned.length;

    console.log(chalk.bold.green(`\nSC${sceneIndex + 1}: ${chalk.underline(scene.sceneTitle)}`));
    console.log();
    console.log(chalk.cyan('Scene Context:'), scene.heading.context);
    console.log(chalk.cyan('Scene Setting:'), scene.heading.setting);
    console.log(chalk.cyan('Scene Sequence:'), scene.heading.sequence);
    console.log(chalk.cyan('Prod Scene #'), scene.heading.prodSceneNum);

    console.log(chalk.yellow('\nScene Lines:\n'));
    scene.linesCleaned.forEach((line, lineIndex) => {
      console.log(chalk.dim(`${lineIndex + 1} |`), chalk.white(line.lineText));
    });

    if (hiddenLinesCount > 0) {
      console.log(chalk.red('\n Cleaned Lines:'), hiddenLinesCount);
    }

    console.log(chalk.dim.gray('\n' + '-'.repeat(60) + '\n'));

    console.log(chalk.bold.magenta(`Elements in SC${sceneIndex + 1}:\n`));
    const elements = scene.elements; // Access the elements array for the current scene
    elements.forEach((element, elementIndex) => {
      console.log(chalk.magenta(`Element ${elementIndex + 1}:`));
      console.log(chalk.cyan('Element ID:'), element.elementID);
      console.log(chalk.cyan('Parent Scene ID:'), element.parentScene.sceneID);
      console.log(chalk.cyan('Parent Scene Title:'), element.parentScene.sceneTitle);
      console.log(chalk.cyan('Type:'), element.type);
      console.log(chalk.cyan('Dual:'), element.dual);
      console.log(chalk.yellow('Element Raw Lines:'));
      element.elementRawLines.forEach((line, lineIndex) => {
        console.log(chalk.dim(`${lineIndex + 1} |`), chalk.white(line.lineText));
      });
      console.log(chalk.dim.gray('\n' + '-'.repeat(60) + '\n'));
    });

    console.log(chalk.dim.gray('-'.repeat(60) + '\n'));
  });
};

main(docRaw, sceneParse, scriptCharacters);