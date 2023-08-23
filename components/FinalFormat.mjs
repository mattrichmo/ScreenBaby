export const parseTitles = async (docRaw, script) => {
    let foundTitle = false;
  
    for (const page of docRaw.pagesRaw) {
      for (const line of page.pageLines) {
        if (line.lineText.trim() !== "") {
          if (!foundTitle) {
            const titleWords = line.lineText.match(/[A-Z][A-Z]+(?:[-:\s][A-Z][A-Z]+)*/g);
            if (titleWords && titleWords.length > 0) {
              script.scriptTitle = titleWords.join(" ");
              foundTitle = true;
            }
          } else {
            const episodeMatch = line.lineText.match(/episode/i);
            if (episodeMatch) {
              script.scriptTitle += " " + line.lineText.trim();
            } else if (line.lineText.includes("\"")) {
              script.scriptTitle += " " + line.lineText.trim();
            } else if (!/^\d+$/.test(line.lineText.trim())) {
              return; // Stop collecting words if line doesn't end with a number
            }
          }
        }
      }
    }
};
export const parseAuthors = async (docRaw, script) => {
    let foundAuthors = false;
    let currentAuthors = [];
    let nextIsCoAuthor = false;

    for (const page of docRaw.pagesRaw) {
        for (const lineIndex in page.pageLines) {
            const line = page.pageLines[lineIndex];
            if (line.lineText.trim() !== "") {
                if (foundAuthors) {
                    if (nextIsCoAuthor) {
                        const coAuthorMatch = line.lineText.match(/^\s*&\s*(\w+)\b/g);
                        if (coAuthorMatch) {
                            currentAuthors.push(coAuthorMatch[0].trim().substring(1));
                        }
                    } else {
                        const authorsMatch = line.lineText.match(/\b\w+\b/g);
                        if (authorsMatch) {
                            currentAuthors.push(...authorsMatch);
                        }
                    }
                } else {
                    const writtenByMatch = line.lineText.match(/(written|screenplay)\s+by:/i);
                    if (writtenByMatch) {
                        foundAuthors = true;
                        nextIsCoAuthor = false;
                        const nextLineIndex = parseInt(lineIndex) + 1;
                        if (nextLineIndex < page.pageLines.length) {
                            const nextLineText = page.pageLines[nextLineIndex].lineText;
                            const coAuthorIndicatorMatch = nextLineText.match(/^\s*&/);
                            if (coAuthorIndicatorMatch) {
                                nextIsCoAuthor = true;
                            }
                        }
                    }
                }
            }
        }
    }

    if (currentAuthors.length > 0) {
        script.scriptAuthor = currentAuthors;
        console.log('script author', script.scriptAuthor)

    }
};



  
export const  finalFormat = async (sceneParse) => {
    const script = {
      scriptTitle: '', // Add your script title here
      scriptAuthor: [], // Add your script author(s) here
      scenes: sceneParse.scenes, // Copy the scene array as is
      cast: [], // Initialize the consolidated cast array
      docMeta: {
        numPages: 0,
        numLines: 0,
        numCharacters: 0,
        numProps: 0,
        numDialogueLines: 0,
      }, // You can populate docMeta as needed
    };
  
    // Create a mapping to track characters and their appearances
    const characterMap = {};
  
    // Loop through each scene
    sceneParse.scenes.forEach((scene, sceneIndex) => {
      // Loop through each character in the scene's cast
      scene.cast.forEach((character) => {
        // If character already exists in the characterMap, update charLines
        if (characterMap[character.characterName]) {
          const charEntry = characterMap[character.characterName];
          const charAppearance = {
            parentSceneTitle: scene.sceneTitle,
            parentSceneIndex: scene.sceneIndex,
            parentSceneLines: character.characterLines,
          };
          charEntry.charAppearances.push(charAppearance);
          charEntry.charSceneLocations.push(sceneIndex); // Update the scene index
        } else {
          // If character doesn't exist, add it to the characterMap
          const charAppearance = {
            parentSceneTitle: scene.sceneTitle,
            parentSceneIndex: scene.sceneIndex,
            parentSceneLines: character.characterLines,
          };
          
          characterMap[character.characterName] = {
            charName: character.characterName,
            charAppearances: [charAppearance],
            charSceneLocations: [sceneIndex], // Initialize scene index array
          };
        }
      });
    });
  
    // Convert the characterMap into an array and assign it to script.cast
    script.cast = Object.values(characterMap);  
    return script;
};

export const finalParse = async (docRaw, sceneParse) => {
    const script = await finalFormat(sceneParse);
    await parseTitles(docRaw, script);
    await parseAuthors(docRaw, script);
    console.log('Script title', script.scriptTitle);
    console.log('script author', script.scriptAuthor)
};
