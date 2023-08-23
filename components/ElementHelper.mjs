import { v4 as uuidv4 } from 'uuid';

export const setElementType = (element) => {
  const firstLine = element.elementRawLines[0].lineText.trim();

  if (firstLine.match(/^(FADE OUT|FADE IN|FADE TO BLACK|FADE TO WHITE|CUT TO|CUT IN|CUT TO BLACK|CUT TO WHITE|DISSOLVE TO|IRIS OUT|IRIS IN|WIPE TO|SMASH CUT TO|MATCH CUT TO|JUMP CUT TO|CUTAWAY TO|CROSSFADE TO|FADE THROUGH TO|FLASH TO|FREEZE FRAME|FADE TO SILENCE|TIME CUT TO|REVERSE CUT TO|CONTINUOUS)/)) {
    element.type = 'transition';
  } else if (firstLine.match(/^[A-Z]+$/)) {
    if (firstLine.match(/[A-Z]+\!$/)) {
      element.type = 'action';
    } else {
      element.type = 'dialogue';
    }
  } else if (firstLine.match(/[a-z]+ [A-Z][a-z]*/)) {
    element.type = 'prop';
  } else if (firstLine.match(/^\s*\(\w+\)\s*$/)) {
    element.type = 'parenthesis';
  } else if (firstLine.match(/^(PAN|TILT|ZOOM|DOLLY|TRACK|CRANE|STEADICAM|HANDHELD)(\s+(UP|DOWN|LEFT|RIGHT|IN|OUT|FORWARD|BACKWARD|UPWARD|DOWNWARD|LEFTWARD|RIGHTWARD|INWARD|OUTWARD|FORWARDS|BACKWARDS|UPWARDS|DOWNWARDS|LEFTWARDS|RIGHTWARDS|INWARDS|OUTWARDS|CLOSE ON))?$/)) {
    element.type = 'camera';
  } else if (firstLine.match(/\b[A-Z]+ING\b$/)) { // Check if the word ends with ING (capitalized)
    element.type = 'action'; // Set the type of the element to 'action'
  }
};



export const setDualDialogue = (elements) => {
  let prevElement = null;
  for (const element of elements) {
    if (element.type === 'dialogue') {
      if (prevElement && prevElement.type === 'dialogue') {
        element.dual = 1;
      } else {
        let nextElement = null;
        for (let i = elements.indexOf(element) + 1; i < elements.length; i++) {
          if (elements[i].type === 'dialogue') {
            nextElement = elements[i];
            break;
          }
        }
        if (nextElement && nextElement.type === 'dialogue') {
          element.dual = 1;
        }
      }
    }
    prevElement = element;
  }
};

export const parseElements = async (sceneParse) => {
  sceneParse.scenes.forEach((scene) => {
    scene.elements = []; // Initialize the elements array for each scene

    let currentElement = null;

    scene.linesCleaned.forEach((line) => {
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
          item: foundItem, // Store the found item in the element
          type: '',
          elementRawLines: [],
          dual: 0,
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
  });

  return sceneParse;
};