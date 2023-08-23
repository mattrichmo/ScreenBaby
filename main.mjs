import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData, parseLinesCharData } from './components/CleanUtils.mjs';
import { parseScenes, cleanScenes, updateSceneHeaders, extractScriptCharacters } from './components/ParseUtils.mjs';
import { parseElements } from './components/ElementHelper.mjs';
import { prettyLog } from './components/PrettyLog.mjs';
import { saveToDatabase } from './components/DB.mjs';
import express from 'express';

// !Important. When you first run npm i, go to node_modules/pdf-parse/index.js and delete all the code in between the debugger tag. For some reason it overrides this file locastion and will say no file exists and throw an error

// ************************************************************


// Command-line Interface (CLI) Arguments - 
//The CLI accepts inputs in the format node main.mjs file.pdf when the PDF is located within the ./scripts directory.
//In cases where the PDF is in a different location, you can provide the full file path for accurate processing.

const inputArg = process.argv[2];
const defaultPDFPath = './scripts/bb.pdf';
let PDF_FILE = defaultPDFPath;

if (inputArg) {
  if (inputArg.startsWith('/')) {
    PDF_FILE = inputArg;
  } else if (!inputArg.includes('/') && !inputArg.includes('..')) {
    PDF_FILE = `./scripts/${inputArg}`;
  } else {
    PDF_FILE = inputArg;
  }
}

export { PDF_FILE };


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
    cast: [{
      characterName: '',
      characterLines: [],
      characterLineCount: 0,
    }], // Optional: List of cast members (array)
    locations: [], // Optional: List of locations in the scene (array)
    props: [{
      propItem: '',
      propLineLocations: [],
    }], // Optional: List of props in the scene (array)
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
      groupType: '', // type of action, character, dialogue, general, parenthetical, shot, transition
      dual: 0, // boolean value. is 1 if multiple dialogue are present in the lines before or after 
      elementRawLines : [],
      item: [{
        name: '',
        id: '',
        type: '',
        sceneLocation: 0
      }]
    }],
    transitions: [{
      item: '',
    }],
    dialogueLines: [{
      char: '',
      lines: [],
    }]  
    },
  ],
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

const sortElementType = async (sceneParse) => {
  sceneParse.scenes.forEach((scene) => {
    const elements = scene.elements;
    elements.forEach((element) => {
      if (element.groupType === 'prop') {
        const propItems = element.elementRawLines.map((line) => line.lineText.trim());
        scene.props = propItems.map((propItem) => ({ propItem }));
      }
      if (element.groupType === 'dialogue') {
        const dialogueItems = element.elementRawLines.map((line) => line.lineText.trim());
        scene.cast = dialogueItems.map((dialogueItem) => ({ dialogueItem }));
      }
    });
  });
};
const extractSceneCharacters = async (sceneParse) => {
  sceneParse.scenes.forEach((scene) => {
    const cast = {};

    scene.elements.forEach((element) => {
      if (element.groupType === 'dialogue') {
        element.item.forEach((item) => {
          const characterName = item.name;
          if (!cast[characterName]) {
            const characterLines = element.elementRawLines.map((line) => line.lineText.trim());
            cast[characterName] = {
              characterName,
              characterLines,
              characterLineCount: characterLines.length - 1,
            };
          } else {
            const character = cast[characterName];
            const newLines = element.elementRawLines.map((line) => line.lineText.trim());
            character.characterLines.push(...newLines);
            character.characterLineCount += newLines.length - 1;
          }
        });
      }
    });

    scene.cast = Object.values(cast);
  });
};

const extractDialogueLines = async (sceneParse) => {
  sceneParse.scenes.forEach((scene) => {
    scene.dialogueLines = []; // Initialize the dialogueLines array for each scene

    scene.elements.forEach((element) => {
      if (element.groupType === 'dialogue') {
        const characterName = element.item[0].name;
        const lines = element.elementRawLines
          .slice(1) // Exclude the first line with the character name
          .map((line) => line.lineText.trim());

        const dialoguePart = {
          char: characterName,
          lines: lines,
        };

        scene.dialogueLines.push(dialoguePart);
      }
    });
  });
};

const extractSceneTransitions = async (sceneParse) => {
  sceneParse.scenes.forEach((scene) => {
    scene.transitions = [];

    scene.elements.forEach((element) => {
      if (element.groupType === 'transition') {
        const itemName = element.item[0].name;

        const transitionPart = {
          item: itemName,
        };
        scene.transitions.push(transitionPart);
      }
    });
  });
};

const sceneDataExtraction = async (sceneParse) => {
  await extractSceneCharacters(sceneParse);
  await extractDialogueLines(sceneParse);
  await extractSceneTransitions(sceneParse);


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
const main = async (docRaw, sceneParse, ) => {
  await initialLoad();
  await parseScenesToObject(docRaw, sceneParse);
  await parseElements(sceneParse);
  await sortElementType(sceneParse);
  await extractSceneCharacters(sceneParse);
  await sceneDataExtraction (sceneParse)
   prettyLog(docRaw, sceneParse);



  

  //await saveToDatabase(sceneParse, docRaw);
};

main(docRaw, sceneParse,);