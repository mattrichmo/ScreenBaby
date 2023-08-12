
// Formatted Script
const document = {
    bookmarks: [
      {
        id: "", // Required: Unique identifier for the bookmark
        parent: "", // Required: Identifier of the parent object being bookmarked
        scene: 0, // Required: Index of the scene the bookmark refers to
        type: "", // Optional: Type of the scene element (string)
        element: 0, // Required: Index of the element within the scene
        title: { en: "" }, // Required: Title of the bookmark (object)
        description: { en: "" } // Required: Description of the bookmark (object)
      }
    ],
    cover: {
      title: {
        en: "", // Required: Title of the work in multiple languages (object)
        "es-mx": ""
      },
      authors: [], // Required: References to author IDs defined in the parent container (array)
      meta: {}, // Optional: Arbitrary meta properties (object)
      derivations: [], // Optional: List of derivation IDs for the cover (array)
      additional: {
        en: "" // Optional: Additional information about the work (object)
      }
    },
    footer: {
      cover: false, // Required: Whether to show the footer on the cover page (boolean)
      display: false, // Required: Whether to display the footer (boolean)
      start: 0, // Required: Page or scene index where the footer starts (number)
      omit: [], // Optional: List of scenes or page indexes where the footer should not be shown (array)
      content: { en: "" }, // Optional: Content of the footer (object)
      meta: {} // Optional: Arbitrary meta properties (object)
    },
    header: {
      cover: false, // Required: Whether to show the header on the cover page (boolean)
      display: false, // Required: Whether to display the header (boolean)
      start: 0, // Required: Page or scene index where the header starts (number)
      omit: [], // Optional: List of scenes or page indexes where the header should not be shown (array)
      content: { en: "" }, // Optional: Content of the header (object)
      meta: {} // Optional: Arbitrary meta properties (object)
    },
    meta: {
      created: "", // Required: Date of creation (string)
      modified: "" // Required: Date of modification (string)
    },
    scenes: [
        {
          heading: { // Required: Heading of the scene (object)
            numbering: 0, // Required: Scene number (number)
            page: 0, // Required: Page number (number)
            context: { en: "" }, // Required: Context of the scene (object)
            setting: { en: "" }, // Required: Setting of the scene (object)
            sequence: { en: "" }, // Required: Sequence of the scene (object)
            description: { en: "" }, // Optional: Description of the scene (object)
            meta: {} // Optional: Arbitrary meta properties (object)
          },
          body: [], // Required: Body of the scene (array)
          animals: [], // Optional: List of animals in the scene (array)
          authors: [], // Optional: List of author IDs (array)
          cast: [], // Optional: List of cast members (array)
          contributors: [], // Optional: List of contributor IDs (array)
          extra: [], // Optional: List of extra elements in the scene (array)
          id: "", // Optional: Unique identifier for the scene (string)
          locations: [], // Optional: List of locations in the scene (array)
          moods: [], // Optional: List of moods in the scene (array)
          props: [], // Optional: List of props in the scene (array)
          sfx: [], // Optional: List of sound effects in the scene (array)
          sounds: [], // Optional: List of sounds in the scene (array)
          tags: [], // Optional: List of tags for the scene (array)
          vfx: [], // Optional: List of visual effects in the scene (array)
          wardrobe: [], // Optional: List of wardrobe items in the scene (array)
          elements: [ // Array of 'Element' objects
            {
              type: "", // Required: Type of the element (string)
              charset: "", // Required: Character set of the element (string)
              dir: "", // Required: Language direction of the element (string)
              content: { // Required: Content of the element (object)
                en: "", // Text in the main language specified in the container (string)
                iso: "" // Text in the iso language code specified (string)
              },
              parent: "", // Required: Identifier of the parent object (string)
              scene: 0, // Required: Index of the scene the element refers to (number)
              id: "", // Required: Unique identifier for the element (string)
              authors: [], // Optional: List of author IDs (array)
              revisions: [], // Required: List of revision IDs for the element (array)
              annotations: [], // Optional: List of annotation IDs for the element (array)
              access: [], // Optional: List of access policy IDs for the element (array)
              encryption: {}, // Optional: Encryption details for the element (object)
              meta: {}, // Optional: Arbitrary meta properties (object)
              dual: false // Optional: Whether the element is a dual-dialogue (boolean)
            }
          ]
        }
      ],
           
    status: {
      color: "", // Required: Color code of the revision (string)
      round: 0, // Required: Round of revisions (number)
      updated: "", // Required: Date of last update (string)
      meta: {} // Optional: Arbitrary meta properties (object)
    },
    styles: [
      {
        id: "", // Required: Unique identifier for the style (string)
        default: false, // Optional: Whether the style is the default presentation (boolean)
        content: "", // Required: CSS content defining the style (string)
        meta: {} // Optional: Arbitrary meta properties (object)
      }
    ],
    templates: [] // Required: List of internal templates for GUI host (array)
};
// The Raw PDF 
const docRaw = {
  pdfRaw: {},
  pageRaw: [],
  pageLineRaw: [[]],
  pageLineCharRaw: [[[]]],
  sceneToPage: [[{ // simply a way to associated which scenes are on which page before we start cleaning lines and parsing scenes
      id: "",
      page: 0,
      line: 0,
      text: "",
  } ]],
}
  