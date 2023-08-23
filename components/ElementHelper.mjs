import { v4 as uuidv4 } from 'uuid';

export const setElementType = (element) => {
  const firstLine = element.elementRawLines[0].lineText.trim();

  if (firstLine.match(/^(FADE OUT|FADE IN|FADE TO BLACK|FADE TO WHITE|CUT TO|CUT IN|CUT TO BLACK|CUT TO WHITE|DISSOLVE TO|IRIS OUT|IRIS IN|WIPE TO|SMASH CUT TO|MATCH CUT TO|JUMP CUT TO|CUTAWAY TO|CROSSFADE TO|FADE THROUGH TO|FLASH TO|FREEZE FRAME|FADE TO SILENCE|TIME CUT TO|REVERSE CUT TO|CONTINUOUS)/)) {
    element.groupType = 'transition';
  } else if (firstLine.match(/^[A-Z]+$/)) {
    if (firstLine.match(/[A-Z]+\!$/)) {
      element.groupType = 'action';
    } else {
      element.groupType = 'dialogue';
    }
  } else if (firstLine.match(/[a-z]+ [A-Z][a-z]*/)) {
    element.groupType = 'prop';
  } else if (firstLine.match(/^\s*\(\w+\)\s*$/)) {
    element.groupType = 'parenthesis';
  } else if (firstLine.match(/^(PAN|TILT|ZOOM|DOLLY|TRACK|CRANE|STEADICAM|HANDHELD)(\s+(UP|DOWN|LEFT|RIGHT|IN|OUT|FORWARD|BACKWARD|UPWARD|DOWNWARD|LEFTWARD|RIGHTWARD|INWARD|OUTWARD|FORWARDS|BACKWARDS|UPWARDS|DOWNWARDS|LEFTWARDS|RIGHTWARDS|INWARDS|OUTWARDS|CLOSE ON))?$/)) {
    element.groupType = 'camera';
  } else if (firstLine.match(/\b[A-Z]+ING\b$/)) { // Check if the word ends with ING (capitalized)
    element.groupType = 'action'; // Set the type of the element to 'action'
  }
};



export const setDualDialogue = (elements) => {
  let consecutiveDialogueCount = 0;
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.groupType === 'dialogue') {
      consecutiveDialogueCount++;
      if (consecutiveDialogueCount > 1) {
        element.dual = 1;
      }
    } else {
      consecutiveDialogueCount = 0;
    }
  }
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.groupType === 'dialogue' && element.dual === 1) {
      let j = i - 1;
      while (j >= 0 && elements[j].type === 'dialogue') {
        elements[j].dual = 1;
        j--;
      }
      j = i + 1;
      while (j < elements.length && elements[j].type === 'dialogue') {
        elements[j].dual = 1;
        j++;
      }
    }
  }
};

export const parseElements = async (sceneParse) => {
  sceneParse.scenes.forEach((scene) => {
    scene.elements = []; // Initialize the elements array for each scene

    let currentElement = null;

    scene.linesCleaned.forEach((line, lineIndex) => {
      const matchResult = line.lineText.match(/\b(?![A-Z](?!-?[A-Z])\b)(?![A-Z]-[A-Z](?!-[A-Z])\b)[A-Z][A-Z-]{0,}(?<!-)(?:\s+[A-Z][A-Z-]{1,}(?<!-))*\b/g);
      
      if (matchResult) {
        const foundItem = matchResult;

        if (currentElement) {
          scene.elements.push(currentElement); // Push the current element to the elements array of the scene
        }

        currentElement = {
          elementID: uuidv4(),
          parentScene: {
            sceneID: scene.sceneID,
            sceneIndex: sceneParse.scenes.indexOf(scene),
            sceneTitle: scene.heading.headingString,
            sceneLineIndex: scene.linesCleaned.indexOf(line),
          },
          groupType: '',
          dual: 0,
          elementRawLines: [],
          item: foundItem.map((item) => ({
            name: item,
            id: uuidv4(),
            type: '',
            sceneLocation: lineIndex,
          })),
        };
      }

      if (currentElement) {
        currentElement.elementRawLines.push(line);
      }
    });

    if (currentElement) {
      scene.elements.push(currentElement); // Push the last element to the elements array of the scene
    }
  });

  sceneParse.scenes.forEach((scene) => {
    scene.elements.forEach((element) => {
      setElementType(element); // Set the type of the element based on the rules you provided
    });
    setDualDialogue(scene.elements);
  });

  return sceneParse;
};
