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

// app.post('/login', async(req, res) => {
//   const {username,password,type}=req.body;
//   const insertQuery = `INSERT INTO login (username, password, type) VALUES ($1, $2, $3) RETURNING *`;
//   const hashedPassword=await bcrypt.hash(password,5)
//   client
//     .query(insertQuery, [username, hashedPassword, type])
//     .then((result) => {
//       const insertedUser = result.rows[0];
//       res.status(201).json(insertedUser);
//       console.log('success')
//     })
//     .catch((error) => {
//       console.error('Error inserting user:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     });
// });

// app.get('/users',async(req,res)=>{
//   const getUser=`select * from login where username="20104035";`;
//   const result=await client.query(getUser)
//   res.send(result);
// })
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const querys = `SELECT * FROM login WHERE username = $1;`;
  const result = await client.query(querys, [username]);
  // const answer= await client.query(querys);
    const storedHashedPassword = result.rows[0].password;
    const passwordMatch = await bcrypt.compare(password, storedHashedPassword);
          const user=result.rows
       const userType=user[0].type
      //  res.send(userType)
      const jwtToken = await jwt.sign({ username }, "JEEVANKUMARKIRUTHIKA", { expiresIn: '1h' });
      res.send(jwtToken)

      // res.status(201).send({ jeevToken: jwtToken,userType:userType,validation:true});


      

  // res.send(passwordMatch)

  // // First, retrieve the user's data from the database based on the username.
  // const getUserQuery = `SELECT * FROM login WHERE username = $1;`;

  // try {
  //   const result = await client.query(getUserQuery, [username]);
  //   // Check if a user with the provided username exists.
  //   if (result.rows.length === 0) {
      
  //     return res.status(404).json({ error: 'User not found' });
  //   }
  //   // Retrieve the stored hashed password from the database.
  //   const storedHashedPassword = result.rows[0].password;
  //   // Compare the provided password with the stored hashed password using bcrypt.
  //   const passwordMatch = await bcrypt.compare(password, storedHashedPassword);
    
  //   if (passwordMatch) {
  //     const user=result.rows
  //      const userType=user[0].type
  //     // Passwords match, so you can consider it as correct.
  //     const jwtToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  //     res.status(201).send({ jeevToken: jwtToken,userType:userType,validation:true});
  //   } else {
  //     // Passwords do not match.
  //     res.status(401).json({ error: 'Password is incorrect' });
  //   }
  // } catch (error) {
  //   console.error('Error retrieving user:', error);
  //   res.status(500).json({ error: 'Internal Server Error' });
  // }
});

app.get('/delete', async(req,res)=>{
  const delQuery=`select * from login;`;
  const resu=await client.query(delQuery)
  res.send(resu)
})


app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

module.exports = app;
