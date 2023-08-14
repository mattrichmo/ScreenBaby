// CleanUtils.mjs

export const createCharObjects = (docRaw) => {
    const pdfRawTextChars = docRaw.pdfRaw.text.split('');
    const pdfRawTextObjects = pdfRawTextChars.map((char) => {
        return {
            text: char,
            x: null,
            y: null,
            w: null,
            clr: null,
            sw: null,
            A: '',
        };
    });
    docRaw.pdfRawText = pdfRawTextObjects;
    return pdfRawTextObjects;
};

export const combineCharData = (docRaw) => {
    const combinedData = [];
    let jsonIndex = 0;

    for (const charObj of docRaw.pdfRawText) {
        if (charObj.text.trim() === '' || charObj.text === '\n') {
            combinedData.push(charObj);
        } else if (jsonIndex < docRaw.rawTextJSONArray.length) {
            combinedData.push({
                ...docRaw.rawTextJSONArray[jsonIndex],
                text: charObj.text,
            });
            jsonIndex++;
        } else {
            combinedData.push(charObj);
        }
    }

    docRaw.combinedChar = combinedData;
};

export const parsePagesandLines = (docRaw) => {
    const pages = docRaw.pdfRaw.text.split(/\r?\n\n/);
    docRaw.pagesRaw = pages.map((pageRawText, pageIndex) => {
        const lines = pageRawText.split(/\r?\n/);
        const pageLines = lines.map((line, lineNumber) => {
            const lineChars = line.split('').map((char) => ({ text: char }));
            return {
                lineNumber: lineNumber + 1,
                lineText: line,
                lineChars: lineChars,
            };
        });

        return {
            pageIndex: pageIndex + 1,
            pageRawText: pageRawText,
            pageLines: pageLines,
        };
    });
};

export const parsePageLinesCharData = (docRaw) => {
    const charArray = docRaw.combinedChar.map(charObj => charObj.text);
    const pages = charArray.join('').split(/\r?\n\n/);

    docRaw.pagesRaw = pages.map((pageRawText, pageIndex) => {
        const lines = pageRawText.split(/\r?\n/);
        const pageLines = lines.map((line, lineNumber) => {
            const lineChars = line.split('').map((char) => {
                const charObj = docRaw.combinedChar.find(obj => obj.text === char);
                return charObj ? charObj : { text: char };
            });
            return {
                lineNumber: lineNumber + 1,
                lineText: line,
                lineChars: lineChars,
            };
        });

        return {
            pageIndex: pageIndex + 1,
            pageRawText: pageRawText,
            pageLines: pageLines,
        };
    });
};
export const parseLinesCharData = (docRaw) => {
    const charArray = docRaw.combinedChar.map(charObj => charObj.text);
    const lines = charArray.join('').split(/\r?\n/);

    docRaw.combinedCharLines = lines.map((line, lineNumber) => {
        const lineChars = line.split('').map((char) => {
            const charObj = docRaw.combinedChar.find(obj => obj.text === char);
            return charObj ? charObj : { text: char };
        });

        // Calculate sceneHeaderLine
        const isSceneHeader = /^(INT\.|EXT\.|INT\/EXT|EXT\/INT)/.test(line);
        // Calculate importantLine
        const words = line.split(/\s+/);
        const isImportant = words.some(word => /^[A-Z]{3,}$/.test(word));

        return {
            lineNumber: lineNumber + 1,
            lineText: line,
            lineChars: lineChars,
            sceneHeaderLine: isSceneHeader ? 1 : 0,
            importantLine: isImportant ? 1 : 0,
        };
    });
};




