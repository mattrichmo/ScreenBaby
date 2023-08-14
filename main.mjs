import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData } from './components/CleanUtils.mjs';
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
};

const sceneParse = {
  scenes: [
    {
      titleRaw: '',
      bodyRaw: '',
      body: [],
      lines: [
        {
          lineText: '',
          lineNumber: null,
        },
      ],
      lineChars: [
        {
          text: '',
          x: null,
          y: null,
          w: null,
          clr: null,
          sw: null,
        },
      ],
    },
  ],
};

const parseScenes = (docRaw, sceneParse) => {
  const headingEnum = [
    'EXT./INT.',
    'EXT./INT.',
    'INT./EXT.',
    'EXT/INT',
    'INT/EXT',
    'INT.',
    'EXT.',
    'INT --',
    'EXT --',
  ];

  const charArray = docRaw.combinedChar.map((charObj) => charObj.text);
  const scenes = charArray
    .join('')
    .split(new RegExp(headingEnum.join('|'), 'g'))
    .map((scene, sceneIndex) => {
      const sceneId = uuidv4();
      const lines = scene
        .split(/\r?\n/)
        .map((line, lineNumber) => {
          const lineId = uuidv4();
          const lineChars = line.split('').map((charItem) => {
            const charObj = docRaw.combinedChar.find((obj) => obj.text === charItem);
            return charObj ? { ...charObj, id: uuidv4(), lineId: lineId, sceneId: sceneId } : { text: charItem, id: uuidv4(), lineId: lineId, sceneId: sceneId };
          });

          return {
            id: lineId,
            sceneId: sceneId,
            lineNumber: lineNumber + 1,
            lineText: line,
            lineChars: lineChars,
          };
        });

      return {
        id: sceneId,
        titleRaw: lines[0].lineText,
        bodyRaw: scene,
        lines: lines,
      };
    });

  sceneParse.scenes = scenes;
};

const cleanScenes = (sceneParse) => {
  const specialCharacters = ['%', '!', '#'];

  sceneParse.scenes.forEach((scene) => {
    const cleanedLines = [];

    scene.lines.forEach((lineObj, index) => {
      const lineText = lineObj.lineText;

      // Check if line is not empty, is not a number possibly followed by a period or parenthesis, and does not start with a special character
      if (
        lineText.trim() !== '' &&
        !lineText.match(/^\d+[.)]?$/) &&
        !specialCharacters.some((char) => lineText.startsWith(char))
      ) {
        cleanedLines.push(lineObj);
      }
    });

    scene.lines = cleanedLines;
  });
};

const initialLoad = async () => {
  await loadPDF(docRaw);
  await readPDFToJson(docRaw);
  await createCharObjects(docRaw);
  await combineCharData(docRaw);
  await parsePageLinesCharData(docRaw);
  parseScenes(docRaw, sceneParse);
  cleanScenes(sceneParse);

  console.log('sceneParse', sceneParse);
  sceneParse.scenes.forEach((scene, sceneIndex) => {
    console.log(chalk.bold(`Scene ${sceneIndex + 1}: ${chalk.underline(scene.titleRaw)}`));
    scene.lines.forEach((line, lineIndex) => {
      console.log(chalk.dim(`${lineIndex + 1} |`), chalk.white(line.lineText));
      //console.log(chalk.gray.dim('cc:'), line.lineChars.length, chalk.gray.dim('Scene ID:'), scene.id, chalk.gray.dim('Line ID:'), line.id);
    });
  });
};

initialLoad();
