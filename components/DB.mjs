import  sqlite3  from "sqlite3";

const db = new sqlite3.Database('mydb.sqlite3');
export const saveToDatabase = async (sceneParse, docRaw) => {
    try {
      const db = new sqlite3.Database('scenes.sqlite3');
      console.log('Connected to the database.');
  
      await db.run(`
        CREATE TABLE IF NOT EXISTS scenes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scene_title TEXT,
          scene_body TEXT,
          scene_elements TEXT,
          scene_number INTEGER
        )
      `);
      console.log('Table "scenes" created successfully.');
  
      await db.run(`
        CREATE TABLE IF NOT EXISTS elements (
          id TEXT PRIMARY KEY,
          parent_scene_id TEXT,
          parent_scene_index INTEGER,
          parent_scene_title TEXT,
          parent_scene_line_index INTEGER,
          type TEXT,
          element_raw_lines TEXT,
          dual INTEGER
        )
      `);
      console.log('Table "elements" created successfully.');
  
      await db.run(`
        CREATE TABLE IF NOT EXISTS doc_raw (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pdf_raw TEXT,
          pages_json_raw TEXT,
          pdf_raw_text TEXT,
          pages_raw TEXT,
          raw_text_json_array TEXT,
          combined_char TEXT,
          combined_char_lines TEXT
        )
      `);
      console.log('Table "doc_raw" created successfully.');
  
      const stmtScenes = db.prepare('INSERT INTO scenes (scene_title, scene_body, scene_elements, scene_number) VALUES (?, ?, ?, ?)');
      const stmtElements = db.prepare('INSERT INTO elements (id, parent_scene_id, parent_scene_index, parent_scene_title, parent_scene_line_index, type, element_raw_lines, dual) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const stmtDocRaw = db.prepare('INSERT INTO doc_raw (pdf_raw, pages_json_raw, pdf_raw_text, pages_raw, raw_text_json_array, combined_char, combined_char_lines) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
      sceneParse.scenes.forEach((scene) => {
        stmtScenes.run(scene.sceneTitle, JSON.stringify(scene.body), JSON.stringify(scene.elements), scene.sceneIndex + 1);
        console.log('Scene data inserted successfully.');
  
        scene.elements.forEach((element) => {
          stmtElements.run(
            element.elementID,
            scene.sceneID,
            scene.sceneIndex,
            scene.sceneTitle,
            element.parentScene.sceneLineIndex,
            element.type,
            JSON.stringify(element.elementRawLines),
            element.dual
          );
          console.log('Element data inserted successfully.');
        });
      });
  
      stmtScenes.finalize();
      console.log('Finalized scenes statement.');
  
      stmtElements.finalize();
      console.log('Finalized elements statement.');
  
      stmtDocRaw.run(
        JSON.stringify(docRaw.pdfRaw),
        JSON.stringify(docRaw.pagesJSONRaw),
        JSON.stringify(docRaw.pdfRawText),
        JSON.stringify(docRaw.pagesRaw),
        JSON.stringify(docRaw.rawTextJSONArray),
        JSON.stringify(docRaw.combinedChar),
        JSON.stringify(docRaw.combinedCharLines)
      );
      console.log('Doc raw data inserted successfully.');
  
      stmtDocRaw.finalize();
      console.log('Finalized doc raw statement.');
  
      db.close();
      console.log('Closed the database connection.');
    } catch (err) {
      console.error('Error:', err.message);
    }
  };