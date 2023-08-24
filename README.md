# ScreenBaby

![](./img/banner2-01.jpg)

## Terrible Name. Great Product. 

ScreenBaby is a node.js PDF Text Parser to parse Screenplays into JSON Objects

## Script Schema

The Script Schema for ScreenBaby is a JSON object that contains information about the script, including the script title, author, scenes, characters, locations, props, dialogue lines, and more. The schema is structured as follows:

```
|script:
|-scriptTitle: 
|-scriptAuthor: 
|-scenes: 
|-|-{
|-|  heading: 
|-|  sceneID: 
|-|  sceneIndex: 
|-|  sceneTitle: 
|-|  bodyRaw: 
|-|  body: 
|-|  animals: 
|-|  cast: 
|-|  |-{
|-|  |  characterName: 
|-|  |  characterLines: 
|-|  |  |-{
|-|  |  |  // Empty object for character lines
|-|  |  |-}
|-|  |  characterLineCount: 
|-|  |  charSceneLocations: 
|-|  |  charLines: 
|-|  |  |-{
|-|  |  |  parentScene: 
|-|  |  |  |-{
|-|  |  |  |  parentSceneTitle: 
|-|  |  |  |  parentSceneIndex: 
|-|  |  |  |  parentSceneLines: 
|-|  |  |  |  |-[]
|-|  |  |  |  |-}
|-|  |  |  |-}
|-|  |  charAppearances: 
|-|  |  |-{
|-|  |  |  parentSceneTitle: 
|-|  |  |  parentSceneIndex: 
|-|  |  |  parentSceneLines: 
|-|  |  |-}
|-|  |-}
|-|  locations: 
|-|  props: 
|-|  |-{
|-|  |  propItem: 
|-|  |  propLineLocations: 
|-|  |-}
|-|  lines: 
|-|  |-{
|-|  |  lineID: 
|-|  |  lineText: 
|-|  |  sceneHeaderLine: 
|-|  |  importantLine: 
|-|  |  lineNumber: 
|-|  |  lineChars: 
|-|  |  |-{
|-|  |  |  text: 
|-|  |  |  charID: 
|-|  |  |  x: 
|-|  |  |  y: 
|-|  |  |  w: 
|-|  |  |  clr: 
|-|  |  |  sw: 
|-|  |  |-}
|-|  |-}
|-|  linesCleaned: 
|-|  |-{
|-|  |  lineID: 
|-|  |  lineText: 
|-|  |  sceneHeaderLine: 
|-|  |  importantLine: 
|-|  |  lineNumber: 
|-|  |  lineChars: 
|-|  |  |-{
|-|  |  |  text: 
|-|  |  |  charID: 
|-|  |  |  x: 
|-|  |  |  y: 
|-|  |  |  w: 
|-|  |  |  clr: 
|-|  |  |  sw: 
|-|  |  |-}
|-|  |-}
|-|  elements: 
|-|  |-{
|-|  |  elementID: 
|-|  |  parentScene: 
|-|  |  |-{
|-|  |  |  sceneID: 
|-|  |  |  sceneIndex: 
|-|  |  |  sceneTitle: 
|-|  |  |  sceneLineIndex: 
|-|  |  |-}
|-|  |  groupType: 
|-|  |  dual: 
|-|  |  elementRawLines: 
|-|  |  item: 
|-|  |  |-{
|-|  |  |  name: 
|-|  |  |  id: 
|-|  |  |  type: 
|-|  |  |  sceneLocation: 
|-|  |  |-}
|-|  |-}
|-|  transitions: 
|-|  |-{
|-|  |  item: 
|-|  |-}
|-|  dialogueLines: 
|-|  |-{
|-|  |  char: 
|-|  |  lines: 
|-|  |-}
|-|-}
|-cast: 
|-|-{
|-|  charName: 
|-|  charSceneLocations: 
|-|  charLines: 
|-|  |-{
|-|  |  parentScene: 
|-|  |  |-{
|-|  |  |  parentSceneTitle: 
|-|  |  |  parentSceneIndex: 
|-|  |  |  parentSceneLines: 
|-|  |  |  |-[]
|-|  |  |  |-}
|-|  |  |-}
|-|  charAppearances: 
|-|  |-{
|-|  |  parentSceneTitle: 
|-|  |  parentSceneIndex: 
|-|  |  parentSceneLines: 
|-|  |-}
|-|-}
|-docMeta: 
|-|-{
|-|  numPages: 
|-|  numLines: 
|-|  numCharacters: 
|-|  numProps: 
|-|  numDialogueLines: 
|-|}
```
## Useage

Upload your PDF script into ./scripts/ and then provide the filename as an arg in the cli. 
Example: 
```node main.mjs breakingbadS05E02.pdf```

or path to the file 

```node main.mjs ./path/to/your/file.pdf ```

# WIP. SO THERE MIGHT BE BUGS.
## Current List of things not working
- elements arents 100% parsing
- some camera is tagged as props 
- determine type for each element item in each element group for items with multiple key lements on the same line
 


## TODO
- parse authors 100%
-use nlp to determine the difference between a key prop and say, an action 



## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "ScreenBaby"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

In other words, do whatever the heck you want with ScreenBaby. We're not responsible for any damage it may cause, but we hope you have fun with it!