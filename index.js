require('dotenv').config();
const express= require('express');
const { Client } = require('pg');

const app = express();
const PORT=process.env.PORT || 3303

const connectionString = process.env.URL; // Replace with your actual ElephantSQL database URL.
const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
});


client.connect()
  .then(() => {
    console.log('Connected to the database');
    // Create the "users" table.
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS kumar (
        id serial PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      );
    `;

    return client.query(createTableQuery);
  })
  .then(() => {
    console.log('Table "users" created successfully');
    // Perform other database operations here.
  })
  .catch((error) => {
    console.error('Error:', error);
  });


  app.get('/users',(res,req)=>{
    res.send({jeev:"vanakkam"})
  })

  app.listen(PORT, ()=>{
   console.log(`listening on port ${PORT}`) 
  })