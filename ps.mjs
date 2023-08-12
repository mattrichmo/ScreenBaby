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
    sceneToPage: [[{
        id: "",
        page: 0,
        line: 0,
        text: "",
    } ]],
}

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
    docRaw.sceneToPage = new Array(docRaw.pageRaw.length).fill([]).map(() => []);
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
        docRaw.sceneToPage[pageIndex] = scenesOnPage;
        console.log(chalk.dim(`Scenes: ${sceneCount}`));
        console.log(chalk.dim(`Characters: ${charCount}`));
        console.log(chalk.dim('Page Content:\n\n'));
        lines.forEach((line, lineIndex) => {
            console.log(chalk.dim(`${lineIndex + 1}: `) + line);
        });
        console.log(chalk.dim('\nScenes:\n\n'));
        scenesOnPage.forEach((scene, sceneIndex) => {
            console.log(chalk.dim(`${sceneIndex + 1}: `) + scene.text);
        });
        console.log('\n');
    });
}





async function parseScript(filePath) {
    // Call 'loadPdf'.
    await loadPdf(filePath);

    // DEBUG Consoles
    //console.log('DocRaw.pdfRaw: ', docRaw);
    //console.log('DocRaw.pageRaw: ', docRaw.pageRaw);
    //console.log('DocRaw.pageLineRaw: ', docRaw.pageLineRaw);
    //console.log('DocRaw.pageLineCharRaw: ', docRaw.pageLineCharRaw);
    //console.log('DocRaw.sceneToPage: ', JSON.stringify(docRaw.sceneToPage, null, 2));

    console.log(chalk.bold.white("\n------------------------"));
    console.log(chalk.bold.white("     Script Statistics"));
    console.log(chalk.bold.white("------------------------\n"));

    console.log(chalk.cyan("Number of Pages: ") + chalk.white(docRaw.pageRaw.length));
    console.log(chalk.cyan("Total Scenes: ") + chalk.white(docRaw.sceneToPage.flat().length));
    console.log(chalk.cyan("Total Characters: ") + chalk.white(docRaw.pageLineCharRaw.flat(2).length));
    console.log(chalk.cyan("Total Lines: ") + chalk.white(docRaw.pageLineRaw.flat().length));
    console.log(chalk.cyan("Total Words: ") + chalk.white(docRaw.pageLineRaw.flat().join(" ").split(/\s+/).length));

    console.log(chalk.bold.white("\n------------------------\n"));
}

parseScript(PDF_FILE)
    .then(() => console.log(chalk.green("PDF parsing finished.")))
    .catch((error) => console.log(chalk.red(`Error parsing PDF: ${error}`)));
