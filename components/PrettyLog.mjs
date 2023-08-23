import chalk from 'chalk';

export const prettyLog = (docRaw, sceneParse) => {
    console.log('screens', JSON.stringify(sceneParse));
  
    console.log(chalk.bold.blue('Parsed scene information:\n'));
  
    sceneParse.scenes.forEach((scene, sceneIndex) => {
      const hiddenLinesCount = scene.lines.length - scene.linesCleaned.length;
  
      console.log(chalk.bold.green(`\nSC${sceneIndex + 1}: ${chalk.underline(scene.heading.headingString)}`));
      console.log();
      console.log(chalk.cyan('Scene Context:'), scene.heading.context);
      console.log(chalk.cyan('Scene Setting:'), scene.heading.setting);
      console.log(chalk.cyan('Scene Sequence:'), scene.heading.sequence);
      console.log(chalk.cyan('Prod Scene #'), scene.heading.prodSceneNum);
      console.log(chalk.blue('Props:'))
      scene.props.forEach((prop, propIndex) => {
        console.log(chalk.cyan(`Prop ${propIndex + 1}:`), prop.propItem);
      });
      console.log(chalk.bold.yellow(`Characters in SC${sceneIndex + 1}:\n`));
      scene.characters.forEach((character, characterIndex) => {
        console.log(chalk.yellow(`Character ${characterIndex + 1}: ${character.characterName} (${character.characterLineCount} lines)`));
      });
  
  
      console.log(chalk.yellow('\nScene Lines:\n'));
      scene.linesCleaned.forEach((line, lineIndex) => {
        console.log(chalk.dim(`${lineIndex + 1} |`), chalk.white(line.lineText));
      });
  
      if (hiddenLinesCount > 0) {
        console.log(chalk.red('\n Cleaned Lines:'), hiddenLinesCount);
      }
  
      console.log(chalk.dim.gray('\n' + '-'.repeat(60) + '\n'));
  
      console.log(chalk.bold.magenta(`Elements in SC${sceneIndex + 1}:\n`));
      const elements = scene.elements; // Access the elements array for the current scene
      elements.forEach((element, elementIndex) => {
        console.log(chalk.magenta(`Element ${elementIndex + 1}:`));
        console.log(chalk.cyan('Element ID:'), element.elementID);
        console.log(chalk.cyan('Parent Scene ID:'), element.parentScene.sceneID);
        console.log(chalk.cyan('Parent Scene Title:'), element.parentScene.sceneTitle);
        console.log(chalk.cyan('Type:'), element.type);
        console.log(chalk.cyan('Dual:'), element.dual);
        console.log(chalk.yellow('Element Item:'), element.item); // Display the element item
        console.log(chalk.yellow('Element Raw Lines:'));
        element.elementRawLines.forEach((line, lineIndex) => {
          console.log(chalk.dim(`${lineIndex + 1} |`), chalk.white(line.lineText));
        });
        console.log(chalk.dim.gray('\n' + '-'.repeat(60) + '\n'));
      });
      console.log(chalk.dim.gray('-'.repeat(60) + '\n'));
    });
  };