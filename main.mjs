import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData, parseLinesCharData } from './components/CleanUtils.mjs';
import { parseScenes, cleanScenes, updateSceneHeaders } from './components/ParseUtils.mjs';
import { parseElements, sortElementType } from './components/ElementHelper.mjs';
import { prettyLog } from './components/PrettyLog.mjs';
import { sceneDataExtraction } from './components/sceneDataExtraction.mjs';
import { finalParse } from './components/FinalFormat.mjs';
import { saveToDatabase } from './components/DB.mjs';
import { startServer } from './components/Server.mjs';


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
const script = {
  scriptTitle: '',
  scriptAuthor: [],
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
  cast: [{
    charName: '',
    charSceneLocations: [0],
    charLines:[
      {
      parentScene: [{
        parentSceneTitle: '',
        parentSceneIndex: '',
        parentSceneLines: [],
      }]
    }
  ],
  }],
  docMeta: {
    numPages: 0,
    numLines: 0,
    numCharacters: 0,
    numProps: 0,
    numDialogueLines: 0,
  },
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
const main = async (docRaw, sceneParse) => {
  await initialLoad();
  await parseScenesToObject(docRaw, sceneParse);
  await parseElements(sceneParse);
  await sortElementType(sceneParse);
  await sceneDataExtraction(sceneParse);

  await finalParse(docRaw, sceneParse);

  //prettyLog(docRaw, script); // Pass docRaw and script to prettyLog
  console.log (JSON.stringify(docRaw.pagesRaw, null, 2))
};
main(docRaw, sceneParse,);