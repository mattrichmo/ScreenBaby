import fs from 'fs';
import pdf from 'pdf-parse';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid'; // Import the UUID library
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';

const PDF_FILE = './scripts/scriptsmall.pdf';

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
          meta: {
            sceneRaw: [],
            sceneCleaned: [],
          }
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
    pdfRaw: {},
    pageRaw: [],
    pageLineRaw: [[]],
    pageLineCharRaw: [[[]]],
    sceneRaw: [],
    sceneToPage: [[{ // simply a way to associated which scenes are on which page before we start cleaning lines and parsing scenes
        id: "",
        page: 0,
        line: 0,
        text: "",
    } ]],
};
const docParse = {
    pageCleaned: [],
    sceneCleaned: [[]],
    pageLineCleaned: [[]],
    pageLineCharCleaned: [[[]]],
};
const sceneParse = {
    scene: [
      {
        id: "",
        page: 0,
        line: 0,
        text: "",
        heading: {
            context: "",
            setting: "",
            sequence: "",
            prodSceneNumber: "",
        },
        content: [],
        elements: [
            {
            id: "",
            title: "",
            content: "",
            },
        ]
      }
    ]
};
async function loadPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    let pdfData;
    try {
        pdfData = await pdf(dataBuffer);
    } catch (error) {
        console.log(chalk.red(`Error parsing PDF Data: ${error}`));
        return;
    }
    docRaw.pdfRaw = pdfData;
    docRaw.pageRaw = pdfData.text.split(/\n\s*\n/);
    docRaw.pageLineRaw = docRaw.pageRaw.map(page => page.split('\n'));
    docRaw.pageLineCharRaw = docRaw.pageLineRaw.map(lines => lines.map(line => [...line]));
    console.log(chalk.bold(`Number of pages: ${docRaw.pageRaw.length}`));
    docRaw.sceneToPage = new Array(docRaw.pageRaw.length).fill(null).map(() => []);
    const headingEnum = [
        "EXT./INT.", "EXT./INT.", "INT./EXT.", "EXT/INT",
        "INT/EXT", "INT.", "EXT.", "INT --", "EXT --"
    ];
    docRaw.pageLineRaw.forEach((lines, pageIndex) => {
        console.log(chalk.bold(`\nPage ${pageIndex + 1}:`));
        console.log(chalk.dim(`Lines: ${lines.length}`));
        const charCount = lines.reduce((count, line) => count + line.length, 0);
        let sceneCount = 0;
        const scenesOnPage = [];
        lines.forEach((line, lineIndex) => {
            if (headingEnum.some(heading => line.includes(heading))) {
                const scene = {
                    id: uuidv4(),
                    page: pageIndex + 1,
                    line: lineIndex + 1,
                    text: line
                };
                scenesOnPage.push(scene);
                sceneCount++;
            }
        });
        if (scenesOnPage.length > 0) {
            docRaw.sceneToPage[pageIndex] = scenesOnPage;
        }
                /* console.log(chalk.dim(`Scenes: ${sceneCount}`));
        console.log(chalk.dim(`Characters: ${charCount}`));
        console.log(chalk.dim('Page Content:\n\n'));
        lines.forEach((line, lineIndex) => {
            console.log(chalk.dim(`${lineIndex + 1}: `) + line);
        });
        console.log(chalk.dim('\nScenes:\n\n'));
        scenesOnPage.forEach((scene, sceneIndex) => {
            console.log(chalk.dim(`${sceneIndex + 1}: `) + scene.text);
        });
        console.log('\n'); */
    });
}
async function cleanPageLines() {
    const specialCharacters = ['--', '!', '?', '@', '%', '...', 'THE END'];
  
    function cleanlines(pageLineRaw) {
      const cleanedPages = [];
      pageLineRaw.forEach((pageLines, pageIndex) => {
        const cleanedLines = pageLines.map((line) => {
          if (typeof line === 'string') {
            const trimmedLine = line.trim();
            if (trimmedLine === '' || /^\d+\.$/.test(trimmedLine)) {
              return null;
            }
            return trimmedLine.split('').filter((char) => !specialCharacters.includes(char)).join('');
          }
          return line;
        }).filter(Boolean); // Remove null values (empty or number with a period).
        cleanedPages.push(cleanedLines);
        console.log(chalk.bold(`\nPage ${pageIndex + 1}:`));
        console.log(chalk.dim(`Lines: ${cleanedLines.length}`));
        console.log(chalk.dim('Cleaned Lines:\n\n'));
        cleanedLines.forEach((line, lineIndex) => {
          console.log(chalk.dim(`${lineIndex + 1}: `) + line);
        });
        console.log('\n');
      });
      return cleanedPages;
    }
  
    docParse.pageLineCleaned = cleanlines(docRaw.pageLineRaw);
    console.log(chalk.bold(`Number of cleaned pages: ${docParse.pageLineCleaned.length}`));
}
async function groupScenes(cleanedLines, sceneParse, docRaw) {
    const headingEnum = [
      "EXT./INT.", "EXT./INT.", "INT./EXT.", "EXT/INT",
      "INT/EXT", "INT.", "EXT.", "INT --", "EXT --"
    ];
  
    let currentScene = null;
  
    docRaw.sceneRaw = [];
  
    cleanedLines.forEach((line, lineIndex) => {
      const hasHeading = headingEnum.some(heading => line.includes(heading));
  
      if (hasHeading) {
        const sceneText = line.trim();
        const correspondingScene = docRaw.sceneToPage.find(entry => entry.text === sceneText);
  
        const id = correspondingScene ? correspondingScene.id[0] : null;
        const page = correspondingScene ? correspondingScene.page[0] : null;
  
        const scene = {
          id,
          page,
          line: lineIndex + 1,
          text: line,
          content: [],
          elements: [],
        };
        sceneParse.scene.push(scene);
        docRaw.sceneRaw.push(scene);
        currentScene = scene;
      } else if (currentScene) {
        currentScene.content.push(line);
      }
    });
  
    sceneParse.scene.forEach((scene, index) => {
      console.log(chalk.cyan(`\n#${index + 1}: ${scene.text}`));
      console.log(chalk.dim(`ID: ${scene.id}`));
      console.log(chalk.dim(`Page: ${scene.page}`));
      console.log(chalk.dim(`Line: ${scene.line}`));
      console.log(chalk.dim(`Text: ${scene.text}`));
      console.log(chalk.dim('Content:\n'));
      scene.content.forEach((line, lineNumber) => {
        console.log(chalk.dim(`${lineNumber + 1}: ${line}`));
      });
    });
  
    return sceneParse;
} 
async function updateSceneHeader(scene, sceneParse, index) {
    const headingEnum = [
      "EXT./INT.", "EXT./INT.", "INT./EXT.", "EXT/INT",
      "INT/EXT", "INT.", "EXT.", "INT --", "EXT --"
    ];
    
    const timeVocab = [
      "NIGHT", "AFTERNOON", "MORNING", "DAYS", "DAY",
      "ANOTHER DAY", "LATER", "SUNSET"
    ];
    
    const headingText = scene.text;
    const heading = {
      context: "",
      setting: "",
      sequence: "",
      prodSceneNumber: ""
    };
    
    // Extract heading context and sequence
    const headingMatch = headingEnum.find(heading => headingText.includes(heading));
    if (headingMatch) {
      heading.context = headingMatch;
      const remainingText = headingText.replace(headingMatch, "").trim();
      const sequenceMatch = timeVocab.find(vocab => remainingText.includes(vocab));
      if (sequenceMatch) {
        heading.sequence = sequenceMatch;
        heading.setting = remainingText.replace(sequenceMatch, "").trim();
      } else {
        heading.setting = remainingText;
      }
    }
    
    // Extract production number
    const lastWord = heading.setting.split(" ").pop();
    if (lastWord && /^\d/.test(lastWord)) {
      // Check if the production number has a mix of digits and characters
      if (/^[0-9A-Za-z]+$/.test(lastWord)) {
        const halfLength = Math.ceil(lastWord.length / 2);
        heading.prodSceneNumber = lastWord.substring(0, halfLength);
        heading.setting = heading.setting.replace(lastWord, "").trim();
      } else {
        heading.prodSceneNumber = lastWord;
        heading.setting = heading.setting.replace(lastWord, "").trim();
      }
    }


    
    // Remove hyphen from the setting property
    heading.setting = heading.setting.replace(/-/g, '').trim();
    
    scene.heading = heading;
    
    console.log(chalk.cyan(`\n#${index + 1}: ${scene.text}`));
    console.log(chalk.dim(`ID: ${sceneParse.scene.id}`));
    console.log(chalk.dim(`Page: ${scene.page}`));
    console.log(chalk.dim(`Line: ${scene.line}`));
    console.log(chalk.dim(`Text: ${scene.text}`));
    console.log(chalk.dim(`Heading:`));
    console.log(chalk.dim(`  Context: ${scene.heading.context}`));
    console.log(chalk.dim(`  Setting: ${scene.heading.setting}`));
    console.log(chalk.dim(`  Sequence: ${scene.heading.sequence}`));
    console.log(chalk.dim(`  prodSceneNumber: ${scene.heading.prodSceneNumber}`));
    console.log(chalk.dim('Content:\n'));
    scene.content.forEach((line, lineNumber) => {
      console.log(chalk.dim(`${lineNumber + 1}: ${line}`));
    });
    
    return scene;
} 
async function parseElements(scene, index) {
    const elements = [];
    let currentElement = null;
    
    scene.content.forEach((line, lineNumber) => {
      const isCapitalWord = /^[A-Z][A-Za-z\s]*$/.test(line.trim());
  
      if (isCapitalWord) {
        if (currentElement) {
          elements.push(currentElement);
        }
        currentElement = {
          title: line.trim(),
          content: [],
          lineNumbers: [lineNumber + scene.line]
        };
      } else if (currentElement) {
        currentElement.content.push(line);
        currentElement.lineNumbers.push(lineNumber + scene.line);
      }
    });
  
    if (currentElement) {
      elements.push(currentElement);
    }
    /* console.log(chalk.cyan(`\nScene ID: ${scene.id}`));
    console.log(chalk.dim(`Page: ${scene.page}`));
    console.log(chalk.dim(`Heading:`));
    console.log(chalk.dim(`  Context: ${scene.heading.context}`));
    console.log(chalk.dim(`  Setting: ${scene.heading.setting}`));
    console.log(chalk.dim(`  Sequence: ${scene.heading.sequence}`));
    console.log(chalk.dim(`  prodSceneNumber: ${scene.heading.prodSceneNumber}`));
    elements.forEach((element) => {
      console.log(chalk.dim('\nElement:'));
      console.log(chalk.dim(`  t: ${element.title}`));
      console.log(chalk.dim(`  Line Number(s): ${element.lineNumbers.join(', ')}`));
      console.log(chalk.dim(`  l:`));
      element.content.forEach((contentLine, contentLineNumber) => {
        console.log(chalk.dim(`${contentLineNumber + 1}: ${contentLine}`));
      });
    }); */
    scene.elements = elements;
  
    return elements;
} 
async function parseScript(filePath) {
    // Call 'loadPdf'.
    await loadPdf(filePath);
    await cleanPageLines();
    await groupScenes(docParse.pageLineCleaned.flat(), sceneParse, docRaw);
  
    // Update scene headers
    for (let index = 0; index < sceneParse.scene.length; index++) {
        const scene = sceneParse.scene[index];
        await updateSceneHeader(scene, sceneParse, index);
        await parseElements(scene, index);
    }
  
    //console.log('docRaw.sceneToPage', JSON.stringify(docRaw.sceneToPage, null, 2));
    //console.log('screenParse', JSON.stringify(sceneParse, null, 2));
    console.log('docRaw', JSON.stringify(docRaw, null, 2));
    console.log(chalk.bold.white("\n------------------------"));
    console.log(chalk.bold.white("     Script Statistics"));
    console.log(chalk.bold.white("------------------------\n"));
  
    // Raw Statistics
    console.log(chalk.yellow("Raw Statistics:"));
    console.log(chalk.cyan("Number of Pages: ") + chalk.white(docRaw.pageRaw.length));
    console.log(chalk.cyan("Total Scenes: ") + chalk.white(docRaw.sceneToPage.flat().length));
    console.log(chalk.cyan("Total Characters (Raw): ") + chalk.white(docRaw.pageLineCharRaw.flat(2).length));
    console.log(chalk.cyan("Total Lines (Raw): ") + chalk.white(docRaw.pageLineRaw.flat().length));
    console.log(chalk.cyan("Total Words (Raw): ") + chalk.white(docRaw.pageLineRaw.flat().join(" ").split(/\s+/).length));
  
    // Cleaned Statistics
    console.log(chalk.green("\nCleaned Statistics:"));
    console.log(chalk.cyan("Number of Pages (Cleaned): ") + chalk.white(docParse.pageLineCleaned.length));
    console.log(chalk.cyan("Total Scenes (Cleaned): ") + chalk.white(docRaw.sceneToPage.flat().length));
    console.log(chalk.cyan("Total Characters (Cleaned): ") + chalk.white(docParse.pageLineCharCleaned.flat(2).length));
    console.log(chalk.cyan("Total Lines (Cleaned): ") + chalk.white(docParse.pageLineCleaned.flat().length));
    console.log(chalk.cyan("Total Words (Cleaned): ") + chalk.white(docParse.pageLineCleaned.flat().join(" ").split(/\s+/).length));
  
    console.log(chalk.bold.white("\n------------------------\n"));
}
parseScript(PDF_FILE)
    .then(() => console.log(chalk.green("PDF parsing finished.")))
    .catch((error) => console.log(chalk.red(`Error parsing PDF: ${error}`)));
