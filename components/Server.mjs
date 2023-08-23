import express from 'express';


export const startServer = async (sceneParse) => {
    const app = express();
   
     // Define a route that responds with the sceneParse object as JSON
     app.get('/api/sceneParse', (req, res) => {
       res.json(sceneParse);
     });
   
     // Start the server
     app.listen(3000, () => {
       console.log('Server is running on port 3000. Link: http://localhost:3000/api/sceneParse');
     });
   };