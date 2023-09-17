require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3303;

const connectionString = process.env.URL; // Replace with your actual ElephantSQL database URL.
const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
});

client
  .connect()
  .then(() => {
    console.log('Connected to the database');
    // Create the "login" table if it doesn't exist.
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS login (
        id serial PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL
      );
    `;

    return client.query(createTableQuery);
  })
  .then(() => {
    console.log('Table "login" created or already exists');
  })
  .catch((error) => {
    console.error('Error:', error);
  });

app.post('/login', async(req, res) => {
  const {username,password,type}=req.body;
  const insertQuery = `INSERT INTO login (username, password, type) VALUES ($1, $2, $3) RETURNING *`;
  const hashedPassword=await bcrypt.hash(password,5)
  client
    .query(insertQuery, [username, hashedPassword, type])
    .then((result) => {
      const insertedUser = result.rows[0];
      res.status(201).json(insertedUser);
      console.log('success')
    })
    .catch((error) => {
      console.error('Error inserting user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.get('/users',async(req,res)=>{
  const getUser=`select * from login;`;
  const result=await client.query(getUser)
  res.send(result);
})



app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

module.exports = app;
