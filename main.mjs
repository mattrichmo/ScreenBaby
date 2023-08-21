import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData, parseLinesCharData } from './components/CleanUtils.mjs';
import { parseScenes, cleanScenes, updateSceneHeaders, extractScriptCharacters } from './components/ParseUtils.mjs';
import chalk from 'chalk';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('mydb.sqlite3');
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
const setElementType = (element) => {
  const firstLine = element.elementRawLines[0].lineText.trim(); // Get the first line of the element and remove any leading/trailing whitespace
  
  if (firstLine.match(/^(FADE OUT|FADE IN|FADE TO BLACK|FADE TO WHITE|CUT TO|CUT IN|CUT TO BLACK|CUT TO WHITE|DISSOLVE TO|IRIS OUT|IRIS IN|WIPE TO|SMASH CUT TO|MATCH CUT TO|JUMP CUT TO|CUTAWAY TO|CROSSFADE TO|FADE THROUGH TO|FLASH TO|FREEZE FRAME|FADE TO SILENCE|TIME CUT TO|REVERSE CUT TO|CONTINUOUS)/)) { // Check for transition tags
    element.type = 'transition'; // Set the type of the element to 'transition'
  } else if (firstLine.match(/^[A-Z]+$/)) { // Check if the first line of the element consists of a single capital word
    if (firstLine.match(/[A-Z]+\!$/)) { // Check if the capital word ends with an exclamation point
      element.type = 'action'; // Set the type of the element to 'action'
    } else {
      element.type = 'dialogue'; // Set the type of the element to 'dialogue'
    }
  } else if (firstLine.match(/[a-z]+ [A-Z][a-z]*/)) { // Check if the first line of the element contains a capital word within a sentence of non-capital words
    element.type = 'prop'; // Set the type of the element to 'prop'
  } else if (firstLine.match(/^\s*\(\w+\)\s*$/)) { // Check if the first line of the element includes a single parenthesis and no words outside the parenthesis
    element.type = 'parenthesis'; // Set the type of the element to 'parenthesis'
  } else if (firstLine.match(/^(PAN|TILT|ZOOM|DOLLY|TRACK|CRANE|STEADICAM|HANDHELD)(\s+(UP|DOWN|LEFT|RIGHT|IN|OUT|FORWARD|BACKWARD|UPWARD|DOWNWARD|LEFTWARD|RIGHTWARD|INWARD|OUTWARD|FORWARDS|BACKWARDS|UPWARDS|DOWNWARDS|LEFTWARDS|RIGHTWARDS|INWARDS|OUTWARDS))?$/)) { // Check if the first line of the element includes a camera movement keyword or variation
    element.type = 'camera'; // Set the type of the element to 'camera'
  } else if (firstLine.match(/\b\w+ing\b(?<!\s)/)) { // Check if the first line of the element includes a word that ends with 'ing' and is not preceded by a space
    element.type = 'action'; // Set the type of the element to 'action'
  }
};


const setDualDialogue = (elements) => {
  let prevElement = null;
  for (const element of elements) {
    if (element.type === 'dialogue') {
      if (prevElement && prevElement.type === 'dialogue') {
        element.dual = 1;
      } else {
        let nextElement = null;
        for (let i = elements.indexOf(element) + 1; i < elements.length; i++) {
          if (elements[i].type === 'dialogue') {
            nextElement = elements[i];
            break;
          }
        }
        if (nextElement && nextElement.type === 'dialogue') {
          element.dual = 1;
        }
      }
    }
    prevElement = element;
  }
};

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
      } else if (line.lineText.match(/^\s*\(\w+\)\s*$/)) {
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
          type: 'parenthesis',
          elementRawLines: [line],
          dual: 0,
        };
        currentElement = null; // Reset the current element to null so that the next line starts a new element
      }

      if (currentElement) {
        currentElement.elementRawLines.push(line);
      }
    });

    if (currentElement) {
      scene.elements.push(currentElement); // Push the last element to the elements array of the scene
    }
  });

  sceneParse.scenes.forEach((scene) => {
    scene.elements.forEach((element) => {
      setElementType(element); // Set the type of the element based on the rules you provided
    });
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
const saveToDatabase = async (sceneParse, docRaw) => {
  try {
    const db = new sqlite3.Database('scenes.sqlite3');
    console.log('Connected to the database.');

    await db.run(`
      CREATE TABLE IF NOT EXISTS scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_title TEXT,
        scene_body TEXT,
        scene_elements TEXT,
        scene_number INTEGER
      )
    `);
    console.log('Table "scenes" created successfully.');

    await db.run(`
      CREATE TABLE IF NOT EXISTS elements (
        id TEXT PRIMARY KEY,
        parent_scene_id TEXT,
        parent_scene_index INTEGER,
        parent_scene_title TEXT,
        parent_scene_line_index INTEGER,
        type TEXT,
        element_raw_lines TEXT,
        dual INTEGER
      )
    `);
    console.log('Table "elements" created successfully.');

    await db.run(`
      CREATE TABLE IF NOT EXISTS doc_raw (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pdf_raw TEXT,
        pages_json_raw TEXT,
        pdf_raw_text TEXT,
        pages_raw TEXT,
        raw_text_json_array TEXT,
        combined_char TEXT,
        combined_char_lines TEXT
      )
    `);
    console.log('Table "doc_raw" created successfully.');

    const stmtScenes = db.prepare('INSERT INTO scenes (scene_title, scene_body, scene_elements, scene_number) VALUES (?, ?, ?, ?)');
    const stmtElements = db.prepare('INSERT INTO elements (id, parent_scene_id, parent_scene_index, parent_scene_title, parent_scene_line_index, type, element_raw_lines, dual) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const stmtDocRaw = db.prepare('INSERT INTO doc_raw (pdf_raw, pages_json_raw, pdf_raw_text, pages_raw, raw_text_json_array, combined_char, combined_char_lines) VALUES (?, ?, ?, ?, ?, ?, ?)');

    sceneParse.scenes.forEach((scene) => {
      stmtScenes.run(scene.sceneTitle, JSON.stringify(scene.body), JSON.stringify(scene.elements), scene.sceneIndex + 1);
      console.log('Scene data inserted successfully.');

      scene.elements.forEach((element) => {
        stmtElements.run(
          element.elementID,
          scene.sceneID,
          scene.sceneIndex,
          scene.sceneTitle,
          element.parentScene.sceneLineIndex,
          element.type,
          JSON.stringify(element.elementRawLines),
          element.dual
        );
        console.log('Element data inserted successfully.');
      });
    });

    stmtScenes.finalize();
    console.log('Finalized scenes statement.');

    stmtElements.finalize();
    console.log('Finalized elements statement.');

    stmtDocRaw.run(
      JSON.stringify(docRaw.pdfRaw),
      JSON.stringify(docRaw.pagesJSONRaw),
      JSON.stringify(docRaw.pdfRawText),
      JSON.stringify(docRaw.pagesRaw),
      JSON.stringify(docRaw.rawTextJSONArray),
      JSON.stringify(docRaw.combinedChar),
      JSON.stringify(docRaw.combinedCharLines)
    );
    console.log('Doc raw data inserted successfully.');

    stmtDocRaw.finalize();
    console.log('Finalized doc raw statement.');

    db.close();
    console.log('Closed the database connection.');
  } catch (err) {
    console.error('Error:', err.message);
  }
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

  //await saveToDatabase(sceneParse, docRaw);
};

main(docRaw, sceneParse, scriptCharacters);