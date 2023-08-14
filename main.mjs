import { loadPDF, readPDFToJson } from './components/LoadUtils.mjs';
import { createCharObjects, combineCharData, parsePageLinesCharData  } from './components/CleanUtils.mjs';
import chalk from 'chalk';


const docRaw = {
    pdfRaw: {},
    pagesJSONRaw: [],
    pdfRawText: [{}],
    pagesRaw: [{
        pageIndex: 0,
        pageID: "", 
        pageRawText: "",
        pageLines: [[""]],
        pageLineChars: [[['']]]
        }],
    rawTextJSONArray : [{}],
    combinedChar: [{}],

};
const sceneParse = {

    scenes: [{
        titleRaw: "", // the line the scene title is on
        bodyRaw: "", // single strong of all the text in the scene
        body: [],
        lines: [{
            lineText: "",
            lineNumber: null,
        }],
        lineChars: [{
            text: "",
            x: null,
            y: null,
            w: null,
            clr: null,
            sw: null,
        }],
    }],
};




const parseScenes = async (docRaw, sceneParse) => {
    const headingEnum = [
        "EXT./INT.", "EXT./INT.", "INT./EXT.", "EXT/INT",
        "INT/EXT", "INT.", "EXT.", "INT --", "EXT --"
    ];

    const charArray = docRaw.combinedChar.map(charObj => charObj.text);
    //join the characters then split if a line includes any of the headingEnum
    const scenes = charArray.join('').split(new RegExp(headingEnum.join('|'), 'g'));
    sceneParse.scenes = scenes.map((scene, sceneIndex) => {
        const lines = scene.split(/\r?\n/);
        const lineChars = lines.map((line, lineNumber) => {
            const lineChars = line.split('').map((charItem) => { // Change 'char' to 'charItem' here
                const charObj = docRaw.combinedChar.find(obj => obj.text === charItem);
                return charObj ? charObj : { text: charItem };
            });
            return {
                lineNumber: lineNumber + 1,
                lineText: line,
                lineChars: lineChars,
            };
        });
        return {
            titleRaw: lines[0],
            bodyRaw: scene,
            lines: lines,
            lineChars: lineChars,
        };
    });
};
const cleanScenes = (sceneParse) => {
    const specialCharacters = ['%', '!', '#'];
    
    sceneParse.scenes.forEach((scene) => {
        const cleanedLines = [];

        scene.lineChars.forEach((lineObj, index) => {
            const lineText = scene.lines[index];

            // Check if line is not empty, is not a number possibly followed by a period or parenthesis, and does not start with a special character
            if (lineText.trim() !== '' && !lineText.match(/^\d+[.)]?$/) && !specialCharacters.some(char => lineText.startsWith(char))) {
                cleanedLines.push({
                    lineText: lineText,
                    lineChars: lineObj.lineChars,
                });
            }
        });

        // Update lines and lineChars in the scene object
        scene.lines = cleanedLines.map(lineObj => lineObj.lineText);
        scene.lineChars = cleanedLines.map(lineObj => ({ lineText: lineObj.lineText, lineChars: lineObj.lineChars })); 
    });
};



const initialLoad = async () => {
    await loadPDF(docRaw);
    await readPDFToJson(docRaw);
    await createCharObjects(docRaw);
    await combineCharData(docRaw);
    //await parsePagesandLines(docRaw);
    await parsePageLinesCharData(docRaw);
    await parseScenes(docRaw, sceneParse);
    await cleanScenes(sceneParse);
    //console.log('sceneParse', JSON.stringify(sceneParse, null, 2));
    console.log('sceneParse', sceneParse);
    sceneParse.scenes.forEach((scene, sceneIndex) => {
        console.log(chalk.bold(`Scene ${sceneIndex + 1}: ${chalk.underline(scene.titleRaw)}`));
        scene.lineChars.forEach((line, lineIndex) => {
            console.log(chalk.dim(`Line ${lineIndex + 1}:`), chalk.white(line.lineText));
            console.log(chalk.gray.dim('cc:'), line.lineChars.length);
        });
    });


};




initialLoad();

  
  