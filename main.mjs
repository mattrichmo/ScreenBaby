import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData, parseLinesCharData } from './components/CleanUtils.mjs';
import { parseScenes, cleanScenes, updateSceneHeaders } from './components/ParseUtils.mjs';
import chalk from 'chalk';

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
  }

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
    console.log(JSON.stringify(docRaw.combinedCharLines, null, 2));

    console.log(chalk.bold.blue('Parsed scene information:\n'));
    console.log(chalk.gray(JSON.stringify(sceneParse, null, 2)));

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

        console.log(chalk.dim.gray('\n' + '-'.repeat(60) + '\n')); // Spacer line
    });
};


main(docRaw, sceneParse);