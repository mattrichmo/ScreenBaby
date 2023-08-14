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
      
    },
  ],
};

const parseScenes = async (docRaw, sceneParse) => {
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
          lines: [], // Include the scene title line here
        };
        currentScene.lines.push({
          lineID: uuidv4(), // Assign a unique ID
          lineText: line.lineText,
          sceneHeaderLine: line.sceneHeaderLine,
          importantLine: line.importantLine,
          lineNumber: currentScene.lines.length + 1,
          lineChars: [], // No need to include character details for scene title line
        });
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
  
const cleanScenes = async (sceneParse) => {
    sceneParse.scenes.forEach((scene) => {
        const filteredLines = scene.lines.filter((line) => {
            const lineText = line.lineText.trim();
            return (
                lineText !== '' &&
                !/^\d+\s*[\).\]]/.test(lineText) && // Remove lines starting with page numbers
                !/^[!@#$%&]/.test(lineText) && // Remove lines starting with special characters
                !/^\s*$/.test(lineText) && // Remove lines that consist only of spaces
                lineText !== '' // Remove lines that are completely empty (contain only "")
            );
        });

        scene.lines = filteredLines;

        if (scene.lines.length === 0) {
            sceneParse.scenes.splice(sceneParse.scenes.indexOf(scene), 1);
        }
    });
};
const updateSceneHeaders = (sceneParse) => {
    const contextRegex = /(EXT\.\/INT\.|INT\.\/EXT\.|EXT\/INT|INT\/EXT|INT\.|EXT\.|INT\s--|EXT\s--)/;
    const sequenceRegex = /(NIGHT|AFTERNOON|MORNING|DAYS|DAY|ANOTHER DAY|LATER|CONTINUOUS|MOMENTS LATER|SUNSET|TWILIGHT|SAME)/;

    sceneParse.scenes.forEach((scene) => {
        scene.heading = {
            context: "",
            sequence: "",
            setting: "",
            prodSceneNum: "",
        };

        const headingText = scene.sceneTitle;
        let heading = headingText;

        const contextMatch = headingText.match(contextRegex);
        if (contextMatch) {
            scene.heading.context = contextMatch[0];
            heading = heading.replace(contextMatch[0], '').trim();
        }

        const sequenceMatch = headingText.match(sequenceRegex);
        if (sequenceMatch) {
            scene.heading.sequence = sequenceMatch[0];
            heading = heading.replace(sequenceMatch[0], '').trim();
        }

        // Extract setting and prodSceneNum
        const settingParts = heading.split('-');
        if (settingParts.length > 1) {
            scene.heading.setting = settingParts[settingParts.length - 2].trim();
            const prodSceneNum = settingParts[settingParts.length - 1].trim();
            scene.heading.prodSceneNum = prodSceneNum.length > 1 ? prodSceneNum.substring(0, Math.ceil(prodSceneNum.length / 2)).toUpperCase() : prodSceneNum;
        } else {
            scene.heading.setting = settingParts[0].trim();
            // Extract and set prodSceneNum from last word
            const words = scene.heading.setting.split(' ');
            const lastWord = words[words.length - 1];
            if (/\d/.test(lastWord)) { // Check if the word contains a number
                const prodSceneNum = lastWord.trim();
                scene.heading.prodSceneNum = prodSceneNum.length > 1 ? prodSceneNum.substring(0, Math.ceil(prodSceneNum.length / 2)).toUpperCase() : prodSceneNum;
            }
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
  await cleanScenes(sceneParse);

await updateSceneHeaders(sceneParse);
  //console.log('docRaw', docRaw);
  console.log(chalk.bold.blue('Parsed scene information:\n'));
  console.log(chalk.gray(JSON.stringify(sceneParse, null, 2)));

  sceneParse.scenes.forEach((scene, sceneIndex) => {
    console.log(chalk.bold.green(`\nSC${sceneIndex + 1}: ${chalk.underline(scene.sceneTitle)}`));
    console.log();
    console.log(chalk.cyan('Scene Context:'), scene.heading.context);
    console.log(chalk.cyan('Scene Setting:'), scene.heading.setting);
    console.log(chalk.cyan('Scene Sequence:'), scene.heading.sequence);
    console.log(chalk.cyan('Prod Scene #'), scene.heading.prodSceneNum);

    console.log(chalk.yellow('\nScene Lines:\n'));
    scene.lines.forEach((line, lineIndex) => {
      console.log(chalk.dim(`${lineIndex + 1} |`), chalk.white(line.lineText));
    });
    console.log(chalk.dim.gray('\n' + '-'.repeat(60) + '\n')); // Spacer line
  });
};

initialLoad();
