import fs from 'fs';
import pdf from 'pdf-parse';
import chalk from 'chalk';

const PDF_FILE = './scripts/scriptsmall.pdf'; // Adjust the path as needed

const headingEnum = [
    "EXT./INT.", "EXT./INT.", "INT./EXT.", "EXT/INT",
    "INT/EXT", "INT.", "EXT.", "INT --", "EXT --"
];

const timeVocab = [
    "NIGHT", "AFTERNOON", "MORNING", "DAYS", "DAY",
    "ANOTHER DAY", "LATER", "CONTINUOUS", "MOMENTS LATER", "SUNSET"
];

const document = {
    scenes: []
};

const extractTime = (text) => {
    const regex = `[-,]?[ ]?(DAWN|DUSK|(LATE|EARLY)?\\s*(${timeVocab.join('|')}))|\\d{4}`;
    const findTime = text.match(regex);
    
    if (!findTime) return null;

    const time = findTime[0].split(/\s+/).filter(item => !!item);
    return time;
};

const extractHeading = (text) => {
    const regionMatch = text.match(/((?:.* )?(?:EXT[.]?\/INT[.]?|INT[.]?\/EXT[.]?|INT(?:\.| --)|EXT(?:\.| --)))\s?/);
    const region = regionMatch ? regionMatch[1] : "";

    const time = extractTime(text);
    const location = text.replace(region, "").trim();

    return {
        region: region,
        location: location,
        time: time
    };
};

const splitScenes = (pageContent) => {
    const scenes = [];
    let currentScene = "";
    
    for (const line of pageContent) {
        if (headingEnum.some(item => line.includes(item))) {
            if (currentScene.trim() !== "") {
                scenes.push(currentScene);
                currentScene = "";
            }
        }
        currentScene += line + "\n";
    }
    
    if (currentScene.trim() !== "") {
        scenes.push(currentScene);
    }
    
    return scenes;
};

fs.promises.readFile(PDF_FILE).then(dataBuffer => {
    pdf(dataBuffer).then(data => {
        const pdfTextLines = data.text.split('\n').filter(line => line.trim() !== '');
        const scenes = splitScenes(pdfTextLines);
        console.log(chalk.yellow('PDF', JSON.stringify(data, null, 2)));
        //console.log(chalk.yellow('PDF text:'), data.text);

        console.log(chalk.yellow('Number of pages:'), data.numpages);
        console.log(chalk.yellow('Number of rendered pages:'), data.numrender);
        console.log(chalk.yellow('PDF info:'), data.info);
        console.log(chalk.yellow('PDF metadata:'), data.metadata); 

        console.log(chalk.yellow(`Number of scenes: ${scenes.length}`));
        
        for (const sceneText of scenes) {
            const headingInfo = extractHeading(sceneText);

            document.scenes.push({
                heading: {
                    numbering: document.scenes.length + 1,
                    context: headingInfo.region,
                    sequence: headingInfo.time ? headingInfo.time[0] : "Unknown Sequence",
                    setting: headingInfo.location,
                    description: sceneText,
                    meta: {}
                },
            });
        }

        //console.log(document.scenes);
        console.log(chalk.green(`Number of scenes: ${document.scenes.length}`));
    }).catch(error => {
        console.error(chalk.red('Error reading PDF:'), error);
    });
}).catch(error => {
    console.error(chalk.red('Error reading file:'), error);
});
