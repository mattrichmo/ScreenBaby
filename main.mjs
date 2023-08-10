import fs from 'fs';
import pdf from 'pdf-parse';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid'; // Import the UUID library
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';

const PDF_FILE = './scripts/kosi.pdf';

const document = {
    bookmarks: [
      {
        id: "",
        parent: "",
        scene: 0,
        type: "",
        element: 0,
        title: { en: "" },
        description: { en: "" }
      }
    ],
    cover: {
      title: {
        en: "",
        fr: ""
      },
      authors: [],
      meta: {},
      derivations: [],
      additional: {
        en: ""
      }
    },
    footer: {
      cover: false,
      display: false,
      start: 0,
      omit: [],
      content: { en: "" },
      meta: {}
    },
    header: {
      cover: false,
      display: false,
      start: 0,
      omit: [],
      content: { en: "" },
      meta: {}
    },
    meta: {
      created: "",
      modified: "",
      pages: 0,
    },
    scenes: [
      {
        heading: {
            index: 0,
          numbering: 0,
          page: 0,
          context: { en: "" },
          setting: { en: "" },
          sequence: { en: "" },
          description: { en: "" },
          meta: {}
        },
        body: [],
        animals: [],
        authors: [],
        cast: [],
        contributors: [],
        extra: [],
        id: "",
        locations: [],
        moods: [],
        props: [],
        sfx: [],
        sounds: [],
        tags: [],
        vfx: [],
        wardrobe: [],
        elements: [
          {
            type: "",
            charset: "",
            dir: "",
            content: {
              en: "",
              iso: ""
            },
            parent: "",
            scene: 0,
            id: "",
            authors: [],
            revisions: [],
            annotations: [],
            access: [],
            encryption: {},
            meta: {},
            dual: false
          }
        ]
      }
    ],
    status: {
      color: "",
      round: 0,
      updated: "",
      meta: {}
    },
    styles: [
      {
        id: "",
        default: false,
        content: "",
        meta: {}
      }
    ],
    templates: []
};
const docRaw = {
    rawTextLines: [],
    cleanedTextLines: [],
}



function cleanLines(lines) {
    const specialCharacters = ['--', '!', '?', '@', '%', '...', 'THE END'];
  
    const cleanedLines = lines.filter(line => {
      const trimmedLine = line.trim();
  
      if (trimmedLine === '' || trimmedLine === '\n') {
        return false;
      }
  
      if (specialCharacters.some(char => trimmedLine.startsWith(char))) {
        return false;
      }
  
      return true;
    });
  
    return cleanedLines;
}
function groupScenes(lines) {
    const headingEnum = [
      "EXT./INT.", "EXT./INT.", "INT./EXT.", "EXT/INT",
      "INT/EXT", "INT.", "EXT.", "INT --", "EXT --"
    ];
  
    const sceneGroups = [];
    let currentGroup = [];
    let sceneIndex = 0; // Initialize the scene index
  
    for (const line of lines) {
      const cleanedLine = line.trim();
      const isSceneHeading = headingEnum.some(pattern => cleanedLine.startsWith(pattern));
  
      if (isSceneHeading) {
        if (currentGroup.length > 0) {
          sceneGroups.push(currentGroup);
          currentGroup = [];
          sceneIndex++; // Move to the next scene index
        }
      }
  
      currentGroup.push(line);
    }
  
    if (currentGroup.length > 0) {
      sceneGroups.push(currentGroup);
    }
  
    return sceneGroups;
}
function cleanScenes(sceneLines) {
    const sceneInfo = {
      context: "",
      sequence: "",
      numbering: "",
      setting: "",
      page: 0
    };
  
    const contextRegex = /(EXT\.\/INT\.|INT\.\/EXT\.|EXT\/INT|INT\/EXT|INT\.|EXT\.|INT\s--|EXT\s--)/;
    const contextMatch = sceneLines[0].match(contextRegex);
    if (contextMatch) {
      sceneInfo.context = contextMatch[0];
    }
  
    const sequenceRegex = /(NIGHT|AFTERNOON|MORNING|DAYS|DAY|ANOTHER DAY|LATER|CONTINUOUS|MOMENTS LATER|SUNSET)/;
    const sequenceMatch = sceneLines[0].match(sequenceRegex);
    if (sequenceMatch) {
      sceneInfo.sequence = sequenceMatch[0];
    }
  
    const sceneNumberRegex = /\d+/;
    const sceneNumberMatches = sceneLines[0].match(sceneNumberRegex);
    if (sceneNumberMatches && sceneNumberMatches.length > 0) {
      sceneInfo.numbering = sceneNumberMatches[0];
    }
  
    const settingRegex = /(?:EXT\.|INT\.)(?:\/[A-Z]+)?(?:\s--)?[\s-]*([^-\d]+)/;
    const settingMatch = sceneLines[0].match(settingRegex);
    if (settingMatch) {
      sceneInfo.setting = settingMatch[1];
    }
  
    for (const line of sceneLines) {
        const pageNumberRegex = /^(\d+)\.$/;
        const pageNumberMatch = line.match(pageNumberRegex);
        if (pageNumberMatch) {
          sceneInfo.page = parseInt(pageNumberMatch[1]);
      }
    }
  
    const cleaned = sceneLines.slice(1); // Remove the first line
  
    return {
      context: sceneInfo.context,
      sequence: sceneInfo.sequence,
      numbering: sceneInfo.numbering,
      setting: sceneInfo.setting,
      page: sceneInfo.page,
      cleaned: cleaned
    };
}
function writeToCsv() {
    const csvWriter = createCsvWriter({
        path: 'output.csv',
        header: [
            { id: 'scene_index', title: 'Scene Index' },
            { id: 'scene_numbering', title: 'Scene Numbering' },
            { id: 'scene_page', title: 'Scene Page' },
            { id: 'scene_context_en', title: 'Scene Context (EN)' },
            { id: 'scene_setting_en', title: 'Scene Setting (EN)' },
            { id: 'scene_sequence_en', title: 'Scene Sequence (EN)' },
            // Add more headers for other scene properties
        ]
    });

    const data = [];
    document.scenes.forEach(scene => {
        const sceneHeading = scene.heading;
        data.push({
            scene_index: sceneHeading.index,
            scene_numbering: sceneHeading.numbering,
            scene_page: sceneHeading.page,
            scene_context_en: sceneHeading.context.en,
            scene_setting_en: sceneHeading.setting.en,
            scene_sequence_en: sceneHeading.sequence.en,
            // Add more properties from the scene object
        });
    });

    csvWriter.writeRecords(data)
        .then(() => {
            console.log('CSV file has been written successfully');
        })
        .catch(error => {
            console.error('Error writing CSV file:', error);
        });
}

  
  
  
  
  
  
  
  
  
  
  async function main() {
    try {
      const dataBuffer = await fs.promises.readFile(PDF_FILE);
      const data = await pdf(dataBuffer);
  
      const lines = data.text.split('\n');
      docRaw.rawTextLines = lines;
      docRaw.cleanedTextLines = cleanLines(lines);
  
      const sceneGroups = groupScenes(docRaw.cleanedTextLines);
  
      const scenes = [];
    let sceneIndex = 0;

    for (const sceneLines of sceneGroups) {
      const cleanedSceneInfo = cleanScenes(sceneLines);

      const sceneId = uuidv4(); // Generate a UUID for the scene

      const scene = {
        heading: {
          id: sceneId, // Set the generated UUID as the scene i
          index: sceneIndex,
          numbering: cleanedSceneInfo.numbering,
          page: cleanedSceneInfo.page,
          context: { en: cleanedSceneInfo.context },
          setting: { en: cleanedSceneInfo.setting },
          sequence: { en: cleanedSceneInfo.sequence },
          description: { en: "" },
          meta: {
            sceneRaw: sceneLines,
            sceneCleaned: cleanedSceneInfo.cleaned
          }
        }
      };

      scenes.push(scene);
      sceneIndex++;
    }
  
      document.scenes = scenes;
      await writeToCsv();
  
      console.log('Updated Document:', JSON.stringify(document, null, 2));
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  main();
  
  
  
  
  
  
  
  

