import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData, parseLinesCharData } from './components/CleanUtils.mjs';
import { parseScenes, cleanScenes, updateSceneHeaders, extractScriptCharacters } from './components/ParseUtils.mjs';
import { setElementType, setDualDialogue, parseElements } from './components/ElementHelper.mjs';
import chalk from 'chalk';
import express from 'express';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('mydb.sqlite3');
// !Important. When you first run npm i, go to node_modules/pdf-parse/index.js and delete all the code in between the debugger tag. For some reason it overrides this file locastion and will say no file exists and throw an error

// ************************************************************

export const PDF_FILE = './scripts/kosi.pdf'; // Define the PDF_FILE constant here

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