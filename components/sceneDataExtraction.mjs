const extractSceneCharacters = async (sceneParse) => {
    sceneParse.scenes.forEach((scene) => {
      const cast = {};
  
      scene.elements.forEach((element) => {
        if (element.groupType === 'dialogue') {
          element.item.forEach((item) => {
            const characterName = item.name;
            if (!cast[characterName]) {
              const characterLines = element.elementRawLines.map((line) => line.lineText.trim());
              cast[characterName] = {
                characterName,
                characterLines,
                characterLineCount: characterLines.length - 1,
              };
            } else {
              const character = cast[characterName];
              const newLines = element.elementRawLines.map((line) => line.lineText.trim());
              character.characterLines.push(...newLines);
              character.characterLineCount += newLines.length - 1;
            }
          });
        }
      });
  
      scene.cast = Object.values(cast);
    });
  };
  
  const extractDialogueLines = async (sceneParse) => {
    sceneParse.scenes.forEach((scene) => {
      scene.dialogueLines = []; // Initialize the dialogueLines array for each scene
  
      scene.elements.forEach((element) => {
        if (element.groupType === 'dialogue') {
          const characterName = element.item[0].name;
          const lines = element.elementRawLines
            .slice(1) // Exclude the first line with the character name
            .map((line) => line.lineText.trim());
  
          const dialoguePart = {
            char: characterName,
            lines: lines,
          };
  
          scene.dialogueLines.push(dialoguePart);
        }
      });
    });
  };
  
  const extractSceneTransitions = async (sceneParse) => {
    sceneParse.scenes.forEach((scene) => {
      scene.transitions = [];
  
      scene.elements.forEach((element) => {
        if (element.groupType === 'transition') {
          const itemName = element.item[0].name;
  
          const transitionPart = {
            item: itemName,
          };
          scene.transitions.push(transitionPart);
        }
      });
    });
  };
  
  
  export const sceneDataExtraction = async (sceneParse) => {
    
    await extractSceneCharacters(sceneParse);
    await extractDialogueLines(sceneParse);
    await extractSceneTransitions(sceneParse);
  };
  
  
  
  
  
  
  
  