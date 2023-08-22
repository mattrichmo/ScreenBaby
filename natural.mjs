import nlp from 'compromise';

const sceneLines = [
  "CLOSE ON a CELL PHONE which VIBRATES atop a stack of books.",
  "An out-of-focus GALE passes the vibrating phone, not noticing it.",
  "A TEA KETTLE whistles on the stove. His hand dips into frame, pouring hot water into a mug."
];

sceneLines.forEach(line => {
  const doc = nlp(line);
  console.log(doc.text());
  doc.word().forEach(term => {
    if (term.tags && term.tags.includes('Noun')) {
      console.log(`${term.text} is a noun.`);
    } else if (term.tags && term.tags.includes('Verb')) {
      console.log(`${term.text} is a verb.`);
    }
  });
});