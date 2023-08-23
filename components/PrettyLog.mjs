import chalk from 'chalk';

export const prettyLog = (docRaw, script) => {
  console.log(chalk.bold.blue('Parsed script information:\n'));

  // Display list of characters
  console.log(chalk.bold.yellow('Characters in the script:\n'));
  script.cast.forEach((cast, castIndex) => {
    console.log(chalk.yellow(`Character ${castIndex + 1}: ${cast.charName}`));
  });

  script.scenes.forEach((scene, sceneIndex) => {
    const hiddenLinesCount = scene.lines.length - scene.linesCleaned.length;

    console.log(chalk.bold.green(`\nSC${sceneIndex + 1}: ${chalk.underline(scene.heading.headingString)}`));
    console.log();
    console.log(chalk.cyan('Scene Context:'), scene.heading.context);
    console.log(chalk.cyan('Scene Setting:'), scene.heading.setting);
    console.log(chalk.cyan('Scene Sequence:'), scene.heading.sequence);
    console.log(chalk.cyan('Prod Scene #'), scene.heading.prodSceneNum);

    // Display the total number of dialogue lines for the scene
    let totalDialogueLines = 0;
    scene.dialogueLines.forEach((dialogueLine) => {
      totalDialogueLines += dialogueLine.lines.length;
    });
    console.log(chalk.cyan(`Total Dialogue Lines: ${totalDialogueLines}`));

    // Display the total number of transitions for the scene
    const totalTransitions = scene.transitions.length;
    console.log(chalk.cyan(`Total Transitions: ${totalTransitions}`));

    console.log('-----------------------------------');
    
    console.log(chalk.blue('Props:'))
    scene.props.forEach((prop, propIndex) => {
      console.log(chalk.cyan(`Prop ${propIndex + 1}:`), prop.propItem);
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
      console.log(chalk.cyan('Group Type:'), element.groupType);
      console.log(chalk.cyan('Dual:'), element.dual);
      
      // Display the element item name and scene location
      element.item.forEach((item) => {
        console.log(chalk.dim(`scene line`, item.sceneLocation, '|'),chalk.yellow('e.'), item.name, );
      });

      console.log(chalk.yellow('Element Raw Lines:'));
      element.elementRawLines.forEach((line, lineIndex) => {
        console.log(chalk.dim(`${lineIndex + 1} |`), chalk.white(line.lineText));
      });
      console.log(chalk.dim.gray('\n' + '-'.repeat(60) + '\n'));
    });
    console.log(chalk.dim.gray('-'.repeat(60) + '\n'));
  });
};
