import { v4 as uuidv4 } from 'uuid';

export const setElementType = (element) => {
  const firstLine = element.elementRawLines[0].lineText.trim(); // Get the first line of the element and remove any leading/trailing whitespace
  
  if (firstLine.match(/^(FADE OUT|FADE IN|FADE TO BLACK|FADE TO WHITE|CUT TO|CUT IN|CUT TO BLACK|CUT TO WHITE|DISSOLVE TO|IRIS OUT|IRIS IN|WIPE TO|SMASH CUT TO|MATCH CUT TO|JUMP CUT TO|CUTAWAY TO|CROSSFADE TO|FADE THROUGH TO|FLASH TO|FREEZE FRAME|FADE TO SILENCE|TIME CUT TO|REVERSE CUT TO|CONTINUOUS)/)) { // Check for transition tags
    element.type = 'transition'; // Set the type of the element to 'transition'
  } else if (firstLine.match(/^[A-Z]+$/)) { // Check if the first line of the element consists of a single capital word
    if (firstLine.match(/[A-Z]+\!$/)) { // Check if the capital word ends with an exclamation point
      element.type = 'action'; // Set the type of the element to 'action'
    } else {
      element.type = 'dialogue'; // Set the type of the element to 'dialogue'
    }
  } else if (firstLine.match(/[a-z]+ [A-Z][a-z]*/)) { // Check if the first line of the element contains a capital word within a sentence of non-capital words
    element.type = 'prop'; // Set the type of the element to 'prop'
  } else if (firstLine.match(/^\s*\(\w+\)\s*$/)) { // Check if the first line of the element includes a single parenthesis and no words outside the parenthesis
    element.type = 'parenthesis'; // Set the type of the element to 'parenthesis'
  } else if (firstLine.match(/^(PAN|TILT|ZOOM|DOLLY|TRACK|CRANE|STEADICAM|HANDHELD)(\s+(UP|DOWN|LEFT|RIGHT|IN|OUT|FORWARD|BACKWARD|UPWARD|DOWNWARD|LEFTWARD|RIGHTWARD|INWARD|OUTWARD|FORWARDS|BACKWARDS|UPWARDS|DOWNWARDS|LEFTWARDS|RIGHTWARDS|INWARDS|OUTWARDS))?$/)) { // Check if the first line of the element includes a camera movement keyword or variation
    element.type = 'camera'; // Set the type of the element to 'camera'
  } else if (firstLine.match(/\b\w+ing\b(?<!\s)/)) { // Check if the first line of the element includes a word that ends with 'ing' and is not preceded by a space
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
      if (line.lineText.match(/[A-Z][A-Z]+/)) {
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
          item: '',
          type: '',
          elementRawLines: [],
          dual: 0,
        };
      } else if (line.lineText.match(/^\s*\(\w+\)\s*$/)) {
        if (currentElement) {
          scene.elements.push(currentElement); // Push the current element to the elements array of the scene
        }
        currentElement = {
          elementID: uuidv4(),
          parentScene: {
            sceneID: scene.sceneID,
            sceneIndex: sceneParse.scenes.indexOf(scene),
            sceneTitle: scene.sceneTitle,
            sceneLineIndex: scene.linesCleaned.indexOf(line),
          },
          type: 'parenthesis',
          elementRawLines: [line],
          dual: 0,
        };
        currentElement = null; // Reset the current element to null so that the next line starts a new element
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