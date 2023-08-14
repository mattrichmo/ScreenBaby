import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData, parseLinesCharData } from './components/CleanUtils.mjs';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

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
  }

const sceneParse = {
  scenes: [{
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
      
    },
  ],
};

const parseScenes = (docRaw, sceneParse) => {
    let currentScene = null;
  
    Object.values(docRaw.combinedCharLines).forEach(line => {
      if (line.sceneHeaderLine === 1) {
        // Start a new scene
        const sceneID = uuidv4();
        currentScene = {
          sceneID: sceneID,
          sceneTitle: line.lineText,
          bodyRaw: '',
          body: [],
          lines: [],
        };
        sceneParse.scenes.push(currentScene);
      } else if (currentScene) {
        // Add line to the current scene
        const lineID = uuidv4();
        const lineChars = line.lineChars.map(char => ({
          ...char,
          charID: uuidv4()
        }));

        currentScene.bodyRaw += line.lineText + '\n';
        currentScene.body.push(line.lineText);
        currentScene.lines.push({
          lineID: lineID,
          lineText: line.lineText,
          sceneHeaderLine: line.sceneHeaderLine,
          importantLine: line.importantLine,
          lineNumber: currentScene.lines.length + 1,
          lineChars: lineChars,
        });
      }
    });
};


const initialLoad = async () => {
  await loadPDF(docRaw);
  await readPDFToJson(docRaw);
  await createCharObjects(docRaw);
  await combineCharData(docRaw);
  await parsePageLinesCharData(docRaw);
  await parseLinesCharData(docRaw);
  await parseScenes(docRaw, sceneParse);
  //cleanScenes(sceneParse);
    //console.log('docRaw', docRaw);
  console.log('sceneParse', sceneParse);
  sceneParse.scenes.forEach((scene, sceneIndex) => {
    console.log(chalk.bold(`SC ${sceneIndex + 1}: ${chalk.underline(scene.sceneTitle)}`));
    scene.lines.forEach((line, lineIndex) => {
      console.log(chalk.dim(`${lineIndex + 1} | `), chalk.white(line.lineText));
      //console.log(chalk.gray('cc:', line.lineChars.length, 'Scene ID:', scene.sceneID, 'Line ID:', line.lineID));
    });
  });
};
initialLoad();
