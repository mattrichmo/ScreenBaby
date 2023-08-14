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
const cleanScenes = async (sceneParse) => {
    sceneParse.scenes.forEach((scene) => {
        scene.lines = scene.lines.filter((line) => {
            const lineText = line.lineText.trim();
            return (
                lineText !== '' &&
                !/^\d+\s*[\).\]]/.test(lineText) && // Remove lines starting with page numbers
                !/^[!@#$%&]/.test(lineText) // Remove lines starting with special characters
            );
        });

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

        const contextMatch = scene.sceneTitle.match(contextRegex);
        if (contextMatch) {
            scene.heading.context = contextMatch[0];

            const contextIndex = scene.sceneTitle.indexOf(contextMatch[0]);
            const dashIndex = scene.sceneTitle.indexOf('-', contextIndex + contextMatch[0].length);

            if (dashIndex !== -1) {
                const settingText = scene.sceneTitle.substring(contextIndex + contextMatch[0].length, dashIndex).trim();
                scene.heading.setting = settingText;
            } else {
                const lastSpaceIndex = scene.sceneTitle.lastIndexOf(' ');
                const settingText = scene.sceneTitle.substring(contextIndex + contextMatch[0].length).trim();
                scene.heading.setting = settingText;
            }
        }

        const sequenceMatch = scene.sceneTitle.match(sequenceRegex);
        if (sequenceMatch) {
            scene.heading.sequence = sequenceMatch[0];
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
  console.log('sceneParse', sceneParse);
  sceneParse.scenes.forEach((scene, sceneIndex) => {
    console.log(chalk.bold(`SC ${sceneIndex + 1}: ${chalk.underline(scene.sceneTitle)}`));
    console.log('Context', scene.heading.context);
    console.log('Sequence', scene.heading.sequence);
    console.log('Setting', scene.heading.setting);
    scene.lines.forEach((line, lineIndex) => {
      console.log(chalk.dim(`${lineIndex + 1} | `), chalk.white(line.lineText));
      //console.log(chalk.gray('cc:', line.lineChars.length, 'Scene ID:', scene.sceneID, 'Line ID:', line.lineID));
    });
  });
};
initialLoad();
