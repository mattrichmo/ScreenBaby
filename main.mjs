import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData, parseLinesCharData } from './components/CleanUtils.mjs';
import { parseScenes, cleanScenes, updateSceneHeaders, extractScriptCharacters } from './components/ParseUtils.mjs';
import { setElementType, setDualDialogue, parseElements } from './components/ElementHelper.mjs';
import { saveToDatabase } from './components/DB.mjs';
import chalk from 'chalk';
import express from 'express';

// !Important. When you first run npm i, go to node_modules/pdf-parse/index.js and delete all the code in between the debugger tag. For some reason it overrides this file locastion and will say no file exists and throw an error

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
    body: [], // Required: Body of the scene (array)
    animals: [], // Optional: List of animals in the scene (array)
    authors: [], // Optional: List of author IDs (array)
    cast: [], // Optional: List of cast members (array)
    contributors: [], // Optional: List of contributor IDs (array)
    extra: [], // Optional: List of extra elements in the scene (array)
    id: "", // Optional: Unique identifier for the scene (string)
    locations: [], // Optional: List of locations in the scene (array)
    moods: [], // Optional: List of moods in the scene (array)
    props: [{
      propItem: '',
    }], // Optional: List of props in the scene (array)
    sfx: [], // Optional: List of sound effects in the scene (array)
    sounds: [], // Optional: List of sounds in the scene (array)
    tags: [], // Optional: List of tags for the scene (array)
    vfx: [], // Optional: List of visual effects in the scene (array)
    wardrobe: [], // Optional: List of wardrobe items in the scene (array)
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
      dual: 0, // boolean value. is 1 if multiple dialogue are present in the lines before or after 
      elementRawLines : [],
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

const sortElementType = (sceneParse) => {
  sceneParse.scenes.forEach((scene) => {
    const elements = scene.elements;
    elements.forEach((element) => {
      if (element.type === 'prop') {
        const propItems = element.elementRawLines.map((line) => line.lineText.trim());
        scene.props = propItems.map((propItem) => ({ propItem }));
      }
      if (element.type === 'dialogue') {
        const dialogueItems = element.elementRawLines.map((line) => line.lineText.trim());
        scene.cast = dialogueItems.map((dialogueItem) => ({ dialogueItem }));
      }
    });
  });
};

//Group Functions 
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
  await sortElementType(sceneParse);

  console.log('screens', JSON.stringify(sceneParse));

  console.log(chalk.bold.blue('Parsed scene information:\n'));

  sceneParse.scenes.forEach((scene, sceneIndex) => {
    const hiddenLinesCount = scene.lines.length - scene.linesCleaned.length;

    console.log(chalk.bold.green(`\nSC${sceneIndex + 1}: ${chalk.underline(scene.heading.headingString)}`));
    console.log();
    console.log(chalk.cyan('Scene Context:'), scene.heading.context);
    console.log(chalk.cyan('Scene Setting:'), scene.heading.setting);
    console.log(chalk.cyan('Scene Sequence:'), scene.heading.sequence);
    console.log(chalk.cyan('Prod Scene #'), scene.heading.prodSceneNum);
    console.log(chalk.blue('Props:'))
    scene.props.forEach((prop, propIndex) => {
      console.log(chalk.cyan(`Prop ${propIndex + 1}:`), prop.propItem);
    });


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

  //await saveToDatabase(sceneParse, docRaw);
};

main(docRaw, sceneParse, scriptCharacters);