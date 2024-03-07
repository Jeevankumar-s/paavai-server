require('dotenv').config();
const express = require('express');
const { format } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');
const { Client } = require('pg');
const bcrypt=require('bcrypt')
const util = require('util');
const jwt=require('jsonwebtoken')
const cors = require('cors'); 
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const { v4: jk } = require('uuid');
const app = express();
app.use(express.json());
app.use(cors()); 
const PORT = process.env.PORT || 3303;
const corsOptions = {
  origin: ['http://localhost:3000', 'https://paavaioutpass.ccbp.tech'], // Add your production URL here
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));

app.use(cors(corsOptions));
const connectionString = process.env.URL; 
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
    CREATE TABLE IF NOT EXISTS outpass2 (
      id TEXT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      registernumber VARCHAR(20) NOT NULL,
      email VARCHAR(255) NOT NULL,
      year VARCHAR(20) NOT NULL,
      department VARCHAR(255) NOT NULL,
      semester VARCHAR(20) NOT NULL,
      reason TEXT NOT NULL,
      current_datetime  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
      status VARCHAR(20) NOT NULL
    );`;
//     const createTableQuery = `
//   CREATE TABLE IF NOT EXISTS login2 (
//     id SERIAL PRIMARY KEY,
//     username VARCHAR(255) UNIQUE NOT NULL,
//     password VARCHAR(255) NOT NULL,
//     type VARCHAR(20) NOT NULL
//   );
// `;
      
   

  
    return client.query(createTableQuery);
  })
  .then(() => {
    console.log('Table "login1" created or already exists');
  })
  .catch((error) => {
    console.error('Error:', error);
  });

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user:"srivasavicollegeoutpass@gmail.com",
      pass: "nopc dpxc johd nvte",
    },
  });

  //for new college 
  const transporter1 = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user:"nandhaartsandscienceoutpass@gmail.com",
      pass: "gnsc kvms uugt uqdq",
    },
  });

  const transporter2 = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user:"vysyaoutpass@gmail.com",
      pass: "dazf mist ancu lrcq",
    },
  });

  const generateDigitalSignature = (studentName) => {
    const secretKey = 'JEEVANKUMAR';
    const signature = crypto.createHmac('sha256', secretKey).update(studentName).digest('hex');
    return signature;
  };

  app.post('/register', async (req, res) => {
    try {
      const { username, password, user } = req.body;
  
      // Hash the user's password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert the user into the database
      const insertUserQuery = `
        INSERT INTO login (username, password, type)
        VALUES ($1, $2, $3)
        RETURNING id, username, type;
      `;
  
      const result = await client.query(insertUserQuery, [username, hashedPassword, user]);
  
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
   // for new college
  app.post('/register1', async (req, res) => {
    try {
      const { username, password, user } = req.body;
  
      // Hash the user's password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert the user into the database
      const insertUserQuery = `
        INSERT INTO login1 (username, password, type)
        VALUES ($1, $2, $3)
        RETURNING id, username, type;
      `;
  
      const result = await client.query(insertUserQuery, [username, hashedPassword, user]);
  
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
// for pradhap college
  app.post('/register2', async (req, res) => {
    try {
      const { username, password, user } = req.body;
  
      // Hash the user's password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert the user into the database
      const insertUserQuery = `
        INSERT INTO login2 (username, password, type)
        VALUES ($1, $2, $3)
        RETURNING id, username, type;
      `;
  
      const result = await client.query(insertUserQuery, [username, hashedPassword, user]);
  
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const getUserQuery = `SELECT * FROM login WHERE username = $1;`;

  try {
    const result = await client.query(getUserQuery, [username]);
    // Check if a user with the provided username exists.
    if (result.rows.length === 0) {
      
      return res.status(404).json({ error: 'User not found' });
    }
    // Retrieve the stored hashed password from the database.
    const storedHashedPassword = result.rows[0].password;
    // Compare the provided password with the stored hashed password using bcrypt.
    const passwordMatch = await bcrypt.compare(password, storedHashedPassword);
    
    if (passwordMatch) {
      const user=result.rows
       const userType=user[0].type
      // Passwords match, so you can consider it as correct.
      const jwtToken = jwt.sign({ username }, "JEEVANKUMAR", { expiresIn: '1h' });
      res.status(201).send({ jeevToken: jwtToken,userType:userType,validation:true});
    } else {
      // Passwords do not match.
      res.status(401).json({ error: 'Password is incorrect' });
    }
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//for new college

app.post('/login1', async (req, res) => {
  const { username, password } = req.body;
  const getUserQuery = `SELECT * FROM login1 WHERE username = $1;`;

  try {
    const result = await client.query(getUserQuery, [username]);
    // Check if a user with the provided username exists.
    if (result.rows.length === 0) {
      
      return res.status(404).json({ error: 'User not found' });
    }
    // Retrieve the stored hashed password from the database.
    const storedHashedPassword = result.rows[0].password;
    // Compare the provided password with the stored hashed password using bcrypt.
    const passwordMatch = await bcrypt.compare(password, storedHashedPassword);
    
    if (passwordMatch) {
      const user=result.rows
       const userType=user[0].type
      // Passwords match, so you can consider it as correct.
      const jwtToken = jwt.sign({ username }, "JEEVANKUMAR", { expiresIn: '1h' });
      res.status(201).send({ jeevToken: jwtToken,userType:userType,validation:true});
    } else {
      // Passwords do not match.
      res.status(401).json({ error: 'Password is incorrect' });
    }
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//for pradhap college 
app.post('/login2', async (req, res) => {
  const { username, password } = req.body;
  const getUserQuery = `SELECT * FROM login2 WHERE username = $1;`;

  try {
    const result = await client.query(getUserQuery, [username]);
    // Check if a user with the provided username exists.
    if (result.rows.length === 0) {
      
      return res.status(404).json({ error: 'User not found' });
    }
    // Retrieve the stored hashed password from the database.
    const storedHashedPassword = result.rows[0].password;
    // Compare the provided password with the stored hashed password using bcrypt.
    const passwordMatch = await bcrypt.compare(password, storedHashedPassword);
    
    if (passwordMatch) {
      const user=result.rows
       const userType=user[0].type
      // Passwords match, so you can consider it as correct.
      const jwtToken = jwt.sign({ username }, "JEEVANKUMAR", { expiresIn: '1h' });
      res.status(201).send({ jeevToken: jwtToken,userType:userType,validation:true});
    } else {
      // Passwords do not match.
      res.status(401).json({ error: 'Password is incorrect' });
    }
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// app.post('/delete', async(req,res)=>{
//   const delQuery=`select * from login1;`;
//   const resu=await client.query(delQuery)
//   res.send(resu)
// })

// app.post('/delete', async (req, res) => {
//   const username = req.body.username; // Assuming you're sending the user ID in the request body

//   try {
//     const delQuery = `DELETE FROM login1 WHERE username = $1;`; // Assuming user_id is the primary key or unique identifier for users
//     const result = await client.query(delQuery, [username]);

//     res.send(`User with ID ${username} deleted successfully.`);
//   } catch (error) {
//     console.error('Error deleting user:', error);
//     res.status(500).send('Error deleting user.');
//   }
// });


app.get('/history',async(req,res)=>{
  const historyQuery=`select * from outpass`
  const result=await client.query(historyQuery)
  res.send(result.rows)
})

//for new college

app.get('/history1',async(req,res)=>{
  const historyQuery=`select * from outpass1`
  const result=await client.query(historyQuery)
  res.send(result.rows)
})

//for pradhap college 
app.get('/history2',async(req,res)=>{
  const historyQuery=`select * from outpass2`
  const result=await client.query(historyQuery)
  res.send(result.rows)
})

app.post('/outpass', async (req, res) => {
  const { name, registernumber, email, year, department, semester, reason } = req.body;
  const currentUtcTime = new Date();
  const istTime = utcToZonedTime(currentUtcTime, 'Asia/Kolkata');
  const formattedIstTime = format(istTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' });
  
  const outpassId = jk() 
  const insertQuery = `
    INSERT INTO outpass (id, name, registernumber, email, year, department, semester, reason, current_datetime, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *;
  `;

  try {
    const result = await client.query(insertQuery, [
      outpassId,
      name,
      registernumber,
      email,
      year,
      department,
      semester,
      reason,
      formattedIstTime,
    ]);

    res.status(201).json({ submission: true, outpass: result.rows[0] });
    console.log(result)
  } catch (error) {
    console.error('Error inserting outpass:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//for new college

app.post('/outpass1', async (req, res) => {
  const { name, registernumber, email, year, department, semester, reason } = req.body;
  const currentUtcTime = new Date();
  const istTime = utcToZonedTime(currentUtcTime, 'Asia/Kolkata');
  const formattedIstTime = format(istTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' });
  
  const outpassId = jk() 
  const insertQuery = `
    INSERT INTO outpass1 (id, name, registernumber, email, year, department, semester, reason, current_datetime, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *;
  `;

  try {
    const result = await client.query(insertQuery, [
      outpassId,
      name,
      registernumber,
      email,
      year,
      department,
      semester,
      reason,
      formattedIstTime,
    ]);

    res.status(201).json({ submission: true, outpass: result.rows[0] });
    console.log(result)
  } catch (error) {
    console.error('Error inserting outpass:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//for pradhap college 
app.post('/outpass2', async (req, res) => {
  const { name, registernumber, email, year, department, semester, reason } = req.body;
  const currentUtcTime = new Date();
  const istTime = utcToZonedTime(currentUtcTime, 'Asia/Kolkata');
  const formattedIstTime = format(istTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' });
  
  const outpassId = jk() 
  const insertQuery = `
    INSERT INTO outpass2 (id, name, registernumber, email, year, department, semester, reason, current_datetime, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *;
  `;

  try {
    const result = await client.query(insertQuery, [
      outpassId,
      name,
      registernumber,
      email,
      year,
      department,
      semester,
      reason,
      formattedIstTime,
    ]);

    res.status(201).json({ submission: true, outpass: result.rows[0] });
    console.log(result)
  } catch (error) {
    console.error('Error inserting outpass:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

app.get('/history/:registerNo/', async (request, response) => {
  const {registerNo} = request.params
  const getOutpass = `
    SELECT
      *
    FROM
      outpass
    WHERE
      registernumber = '${registerNo}';`
  const result = await client.query(getOutpass)
  response.send(result.rows)
})

//for new college 

app.get('/history1/:registerNo/', async (request, response) => {
  const {registerNo} = request.params
  const getOutpass = `
    SELECT
      *
    FROM
      outpass1
    WHERE
      registernumber = '${registerNo}';`
  const result = await client.query(getOutpass)
  response.send(result.rows)
})

//for pradhap college 
app.get('/history2/:registerNo/', async (request, response) => {
  const {registerNo} = request.params
  const getOutpass = `
    SELECT
      *
    FROM
      outpass2
    WHERE
      registernumber = '${registerNo}';`
  const result = await client.query(getOutpass)
  response.send(result.rows)
})

app.get('/outpass/:id', async (req, res) =>{
  const {id}=req.params
  console.log(id)
  const rquery=`select * from outpass where id=${id};`;
  const results= await client.query(rquery)
  res.send(results.rows)
})

//for new college

app.get('/outpass1/:id', async (req, res) =>{
  const {id}=req.params
  console.log(id)
  const rquery=`select * from outpass1 where id=${id};`;
  const results= await client.query(rquery)
  res.send(results.rows)
})

//for pradhap college

app.get('/outpass2/:id', async (req, res) =>{
  const {id}=req.params
  console.log(id)
  const rquery=`select * from outpass2 where id=${id};`;
  const results= await client.query(rquery)
  res.send(results.rows)
})

const sendAcceptanceEmail = async (studentEmail, id, studentName, registerNo, department, year,reason) => {
  const doc = new PDFDocument();

  try {

    doc.font('./fonts/arial.ttf');
    doc.font('./fonts/ARIBL0.ttf');

    const collegeLogoPath = './images/vasavilogo.png'; 
    const backgroundImagePath = './images/vasavicollege.png';
    const backgroundImage = fs.readFileSync(backgroundImagePath);

    const logoImage = fs.readFileSync(collegeLogoPath);
    doc.image(logoImage, 50, 50, { width: 70, y:70 }); 
    doc.image(backgroundImage, 40, 140, { width: 612-80, height: 792-180 ,opacity: 0.1});
    
    doc.moveUp(2)
    doc.fontSize(20).text('SRI VASAVI COLLEGE', { align: 'center',bold: true, y: -30});
    doc.fontSize(14).text('Erode,Tamilnadu-638316 ', { align: 'center' });
    const lineStartX = 30; // Adjust the X-coordinate as needed
    const lineStartY = doc.y + 30; // Adjust the Y-coordinate to position the line below the text
    const lineEndX = doc.page.width - 30; // Adjust the X-coordinate for the line's end point
    doc.moveTo(lineStartX, lineStartY).lineTo(lineEndX, lineStartY).stroke();
    
    doc.moveDown(5);
    
    doc.fontSize(16).text('OUTPASS DETAILS', { align: 'center', bold: true, color: 'blue' });
    
    const textWidth = doc.widthOfString('OUTPASS DETAILS');
    const textX = (doc.page.width - textWidth) / 2;
    const underlineY = doc.y + 6; // Adjust the Y-coordinate for the underline
    doc.moveTo(textX, underlineY).lineTo(textX + textWidth, underlineY).stroke();
    

    doc.moveDown(2);
    


    const studentNameWidth = doc.widthOfString(`Student Name: ${studentName}`);
    const studentNameX = (doc.page.width - studentNameWidth) / 2.1;

    const istTime = new Date();
    const formattedIstTime = format(istTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' });    
    // const acceptanceDateTime = now.toLocaleString();
    // console.log(formattedIstTime)
    
    
    doc.fontSize(20).text(`Student Name : ${studentName}`, studentNameX);
    doc.fontSize(20).text(`Register No : ${registerNo}`);
    doc.fontSize(20).text(`Department : ${department}`);
    doc.fontSize(20).text(`Year : ${year}`);
    doc.fontSize(20).text(`Reason: ${reason}`);
    doc.fontSize(20).text(`Date and Time of Acceptance: ${formattedIstTime}`);
    
    doc.moveDown(5);

    // Load the checkmark image
const checkmarkImagePath = './images/tick.png'; // Replace with the actual path to your checkmark image
const checkmarkImage = fs.readFileSync(checkmarkImagePath);

// Calculate the X-coordinate for the checkmark image (centered above the text)
const centerX = doc.page.width / 2;
const checkmarkWidth = 40; // Adjust the width of the checkmark image
const checkmarkX = centerX - checkmarkWidth / 2;

const yPosText = doc.page.height - 30; // Y-coordinate for the text
const yPosCheckmark = yPosText - 180; // Y-coordinate for the checkmark (adjust the value as needed)

// Add the checkmark image above the text
doc.image(checkmarkImage, checkmarkX+20, yPosCheckmark, { width: checkmarkWidth });
doc.image(checkmarkImage, checkmarkX+140, yPosCheckmark, { width: checkmarkWidth });

// Add the "Staff Sign" and "HOD Sign" text
doc.text('Tutor Sign    HOD Sign', { align: 'center', width: doc.page.width - 170, y: yPosText, x: doc.page.width - 110 }); // Adjust the 'x' value as needed


  
    const watermarkText = 'VASAVI OUTPASS';

    const watermarkWidth = doc.widthOfString(watermarkText);
    const watermarkHeight = doc.currentLineHeight();
    const watermarkX = (doc.page.width - watermarkWidth) / 3.9;
    const watermarkY = (doc.page.height - watermarkHeight) / 1.5;
   
    const watermarkRotation = -45; // Negative angle for left tilt

    doc.rotate(watermarkRotation, { origin: [watermarkX, watermarkY] })
       .fontSize(45)
       .fillOpacity(0.2)
       .text(watermarkText, watermarkX, watermarkY, { align: 'center'});

    const signature = generateDigitalSignature(studentName);

  doc.fontSize(12).text(`Digital Signature: ${signature}`,{ align: 'center' });

  
  // Determine the available width for both labels
  
// Add these lines after all other content is added

  // Calculate the X-coordinates for both labels to center them
  
  // Set the Y-coordinate for both labels
  
    //    const pdfPath = './outpass_acceptance.pdf'; // Define the file path where you want to save the PDF
    // doc.pipe(fs.createWriteStream(pdfPath)); 
    doc.end();


    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });


    const mailOptions = {
      from: 'vasavioutpass@gmail.com',
      to: studentEmail,
      subject: 'Outpass Accepted',
      text: `Your outpass with ID ${id} has been accepted.`,
      attachments: [
        {
          filename: 'outpass_acceptance.pdf',
          content: pdfBuffer, 
          contentType: 'application/pdf',
        },
      ],
    };


    const sendMailAsync = util.promisify(transporter.sendMail.bind(transporter));
    await sendMailAsync(mailOptions);


    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

//for new college 

const sendAcceptanceEmail1 = async (studentEmail, id, studentName, registerNo, department, year,reason) => {
  const doc = new PDFDocument();

  try {

    doc.font('./fonts/arial.ttf');
    doc.font('./fonts/ARIBL0.ttf');

    const collegeLogoPath = './images/nandhalogo.png'; 
    const backgroundImagePath = './images/nandhacollege.png';
    const backgroundImage = fs.readFileSync(backgroundImagePath);

    const logoImage = fs.readFileSync(collegeLogoPath);
    doc.image(logoImage, 20, 30, { width: 70, y:80 }); 
    doc.image(backgroundImage, 40, 140, { width: 612-80, height: 792-180 ,opacity: 0.1});
    
    doc.moveUp(2)
    doc.fontSize(20).text('NANDHA ARTS AND SCIENCE COLLEGE', { align: 'center',bold: true, y: -30});
    doc.fontSize(14).text('Koorapalayam Pirivu,', { align: 'center' });
    doc.fontSize(14).text('Erode, Tamilnadu-638052 ', { align: 'center' });
    const lineStartX = 30; // Adjust the X-coordinate as needed
    const lineStartY = doc.y + 30; // Adjust the Y-coordinate to position the line below the text
    const lineEndX = doc.page.width - 30; // Adjust the X-coordinate for the line's end point
    doc.moveTo(lineStartX, lineStartY).lineTo(lineEndX, lineStartY).stroke();
    
    doc.moveDown(5);
    
    doc.fontSize(16).text('OUTPASS DETAILS', { align: 'center', bold: true, color: 'blue' });
    
    const textWidth = doc.widthOfString('OUTPASS DETAILS');
    const textX = (doc.page.width - textWidth) / 2;
    const underlineY = doc.y + 6; // Adjust the Y-coordinate for the underline
    doc.moveTo(textX, underlineY).lineTo(textX + textWidth, underlineY).stroke();
    

    doc.moveDown(2);
    


    const studentNameWidth = doc.widthOfString(`Student Name: ${studentName}`);
    const studentNameX = (doc.page.width - studentNameWidth) / 2.1;

    const istTime = new Date();
    const formattedIstTime = format(istTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' });    
    // const acceptanceDateTime = now.toLocaleString();
    // console.log(formattedIstTime)
    
    
    doc.fontSize(20).text(`Student Name : ${studentName}`, studentNameX);
    doc.fontSize(20).text(`Register No : ${registerNo}`);
    doc.fontSize(20).text(`Department : ${department}`);
    doc.fontSize(20).text(`Year : ${year}`);
    doc.fontSize(20).text(`Reason: ${reason}`);
    doc.fontSize(20).text(`Date and Time of Acceptance: ${formattedIstTime}`);
    
    doc.moveDown(5);

    // Load the checkmark image
const checkmarkImagePath = './images/tick.png'; // Replace with the actual path to your checkmark image
const checkmarkImage = fs.readFileSync(checkmarkImagePath);

// Calculate the X-coordinate for the checkmark image (centered above the text)
const centerX = doc.page.width / 2;
const checkmarkWidth = 40; // Adjust the width of the checkmark image
const checkmarkX = centerX - checkmarkWidth / 2;

const yPosText = doc.page.height - 30; // Y-coordinate for the text
const yPosCheckmark = yPosText - 180; // Y-coordinate for the checkmark (adjust the value as needed)

// Add the checkmark image above the text
doc.image(checkmarkImage, checkmarkX+50, yPosCheckmark, { width: checkmarkWidth });
doc.image(checkmarkImage, checkmarkX+170, yPosCheckmark, { width: checkmarkWidth });

// Add the "Staff Sign" and "HOD Sign" text
doc.text('Tutor Sign    HOD Sign', { align: 'center', width: doc.page.width - 170, y: yPosText, x: doc.page.width - 110 }); // Adjust the 'x' value as needed


  
    const watermarkText = 'NANDHA OUTPASS';

    const watermarkWidth = doc.widthOfString(watermarkText);
    const watermarkHeight = doc.currentLineHeight();
    const watermarkX = (doc.page.width - watermarkWidth) / 3.9;
    const watermarkY = (doc.page.height - watermarkHeight) / 1.5;
   
    const watermarkRotation = -45; // Negative angle for left tilt

    doc.rotate(watermarkRotation, { origin: [watermarkX, watermarkY] })
       .fontSize(45)
       .fillOpacity(0.2)
       .text(watermarkText, watermarkX, watermarkY, { align: 'center'});

    const signature = generateDigitalSignature(studentName);

  doc.fontSize(12).text(`Digital Signature: ${signature}`,{ align: 'center' });

  
  // Determine the available width for both labels
  
// Add these lines after all other content is added

  // Calculate the X-coordinates for both labels to center them
  
  // Set the Y-coordinate for both labels
  
    //    const pdfPath = './outpass_acceptance.pdf'; // Define the file path where you want to save the PDF
    // doc.pipe(fs.createWriteStream(pdfPath)); 
    doc.end();


    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });


    const mailOptions = {
      from: 'nandhaartsandscienceoutpass@gmail.com',
      to: studentEmail,
      subject: 'Outpass Accepted',
      text: `Your outpass with ID ${id} has been accepted.`,
      attachments: [
        {
          filename: 'outpass_acceptance.pdf',
          content: pdfBuffer, 
          contentType: 'application/pdf',
        },
      ],
    };


    const sendMailAsync = util.promisify(transporter.sendMail.bind(transporter1));
    await sendMailAsync(mailOptions);


    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// for pradhap college 

const sendAcceptanceEmail2 = async (studentEmail, id, studentName, registerNo, department, year,reason) => {
  const doc = new PDFDocument();

  try {

    doc.font('./fonts/arial.ttf');
    doc.font('./fonts/ARIBL0.ttf');

    const collegeLogoPath = './images/vysyacollege.png'; 
    const backgroundImagePath = './images/vysyabuilding.png';
    const backgroundImage = fs.readFileSync(backgroundImagePath);

    const logoImage = fs.readFileSync(collegeLogoPath);
    doc.image(logoImage, 20, 30, { width: 70, y:80 }); 
    doc.image(backgroundImage, 40, 140, { width: 612-80, height: 792-180 ,opacity: 0.1});
    
    doc.moveUp(2)
    doc.fontSize(20).text('VYSYA ARTS AND SCIENCE COLLEGE', { align: 'center',bold: true, y: -30});
    doc.fontSize(14).text('Masinaixkenpatty, Ayodhiyapattinam (P.O),', { align: 'center' });
    doc.fontSize(14).text('Salem, Tamilnadu-636 103 ', { align: 'center' });
    const lineStartX = 30; // Adjust the X-coordinate as needed
    const lineStartY = doc.y + 30; // Adjust the Y-coordinate to position the line below the text
    const lineEndX = doc.page.width - 30; // Adjust the X-coordinate for the line's end point
    doc.moveTo(lineStartX, lineStartY).lineTo(lineEndX, lineStartY).stroke();
    
    doc.moveDown(5);
    
    doc.fontSize(16).text('OUTPASS DETAILS', { align: 'center', bold: true, color: 'blue' });
    
    const textWidth = doc.widthOfString('OUTPASS DETAILS');
    const textX = (doc.page.width - textWidth) / 2;
    const underlineY = doc.y + 6; // Adjust the Y-coordinate for the underline
    doc.moveTo(textX, underlineY).lineTo(textX + textWidth, underlineY).stroke();
    

    doc.moveDown(2);
    


    const studentNameWidth = doc.widthOfString(`Student Name: ${studentName}`);
    const studentNameX = (doc.page.width - studentNameWidth) / 2.1;

    const istTime = new Date();
    const formattedIstTime = format(istTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' });    
    // const acceptanceDateTime = now.toLocaleString();
    // console.log(formattedIstTime)
    
    
    doc.fontSize(20).text(`Student Name : ${studentName}`, studentNameX);
    doc.fontSize(20).text(`Register No : ${registerNo}`);
    doc.fontSize(20).text(`Department : ${department}`);
    doc.fontSize(20).text(`Year : ${year}`);
    doc.fontSize(20).text(`Reason: ${reason}`);
    doc.fontSize(20).text(`Date and Time of Acceptance: ${formattedIstTime}`);
    
    doc.moveDown(5);

    // Load the checkmark image
const checkmarkImagePath = './images/tick.png'; // Replace with the actual path to your checkmark image
const checkmarkImage = fs.readFileSync(checkmarkImagePath);

// Calculate the X-coordinate for the checkmark image (centered above the text)
const centerX = doc.page.width / 2;
const checkmarkWidth = 40; // Adjust the width of the checkmark image
const checkmarkX = centerX - checkmarkWidth / 2;

const yPosText = doc.page.height - 30; // Y-coordinate for the text
const yPosCheckmark = yPosText - 180; // Y-coordinate for the checkmark (adjust the value as needed)

// Add the checkmark image above the text
doc.image(checkmarkImage, checkmarkX+50, yPosCheckmark, { width: checkmarkWidth });
doc.image(checkmarkImage, checkmarkX+170, yPosCheckmark, { width: checkmarkWidth });

// Add the "Staff Sign" and "HOD Sign" text
doc.text('Tutor Sign    HOD Sign', { align: 'center', width: doc.page.width - 170, y: yPosText, x: doc.page.width - 110 }); // Adjust the 'x' value as needed


  
    const watermarkText = 'VYSYA OUTPASS';

    const watermarkWidth = doc.widthOfString(watermarkText);
    const watermarkHeight = doc.currentLineHeight();
    const watermarkX = (doc.page.width - watermarkWidth) / 3.9;
    const watermarkY = (doc.page.height - watermarkHeight) / 1.5;
   
    const watermarkRotation = -45; // Negative angle for left tilt

    doc.rotate(watermarkRotation, { origin: [watermarkX, watermarkY] })
       .fontSize(45)
       .fillOpacity(0.2)
       .text(watermarkText, watermarkX, watermarkY, { align: 'center'});

    const signature = generateDigitalSignature(studentName);

  doc.fontSize(12).text(`Digital Signature: ${signature}`,{ align: 'center' });

  
  // Determine the available width for both labels
  
// Add these lines after all other content is added

  // Calculate the X-coordinates for both labels to center them
  
  // Set the Y-coordinate for both labels
  
    //    const pdfPath = './outpass_acceptance.pdf'; // Define the file path where you want to save the PDF
    // doc.pipe(fs.createWriteStream(pdfPath)); 
    doc.end();


    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });


    const mailOptions = {
      from: 'vysyaoutpass@gmail.com',
      to: studentEmail,
      subject: 'Outpass Accepted',
      text: `Your outpass with ID ${id} has been accepted.`,
      attachments: [
        {
          filename: 'outpass_acceptance.pdf',
          content: pdfBuffer, 
          contentType: 'application/pdf',
        },
      ],
    };


    const sendMailAsync = util.promisify(transporter.sendMail.bind(transporter2));
    await sendMailAsync(mailOptions);


    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



 

app.post('/outpass/:id/accept', async (req, res) => {
  const id = req.params.id;

  try {
    console.log(`Accepting outpass with ID: ${id}...`);

    const updateQuery = `
      UPDATE outpass
      SET status = 'HOD Accepted'
      WHERE id = $1
      RETURNING *;
    `;
    const updatedOutpass = await client.query(updateQuery, [id]);

    if (updatedOutpass.rows.length === 0) {
      console.error(`Outpass with ID ${id} not found.`);
      return res.status(404).json({ success: false, message: 'Outpass not found' });
    }


    // Fetch the outpass details from the database
    const outpassQuery = `
      SELECT * FROM outpass WHERE id = $1;
    `;
    const { rows } = await client.query(outpassQuery, [id]);
    const outpass = rows[0];

    if (!outpass) {
      console.error(`Outpass with ID ${id} not found in the database.`);
      return res.status(404).json({ success: false, message: 'Outpass not found in the database' });
    }


    await sendAcceptanceEmail(outpass.email, id, outpass.name, outpass.registernumber,outpass.department,outpass.year,outpass.reason);


    res.json({ success: true, email: outpass.email});
  } catch (error) {
    console.error('Error accepting outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while accepting outpass' });
  }
});

//for new college

app.post('/outpass1/:id/accept', async (req, res) => {
  const id = req.params.id;

  try {
    console.log(`Accepting outpass with ID: ${id}...`);

    const updateQuery = `
      UPDATE outpass1
      SET status = 'HOD Accepted'
      WHERE id = $1
      RETURNING *;
    `;
    const updatedOutpass = await client.query(updateQuery, [id]);

    if (updatedOutpass.rows.length === 0) {
      console.error(`Outpass with ID ${id} not found.`);
      return res.status(404).json({ success: false, message: 'Outpass not found' });
    }


    // Fetch the outpass details from the database
    const outpassQuery = `
      SELECT * FROM outpass1 WHERE id = $1;
    `;
    const { rows } = await client.query(outpassQuery, [id]);
    const outpass = rows[0];

    if (!outpass) {
      console.error(`Outpass with ID ${id} not found in the database.`);
      return res.status(404).json({ success: false, message: 'Outpass not found in the database' });
    }


    await sendAcceptanceEmail1(outpass.email, id, outpass.name, outpass.registernumber,outpass.department,outpass.year,outpass.reason);


    res.json({ success: true, email: outpass.email});
  } catch (error) {
    console.error('Error accepting outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while accepting outpass' });
  }
});

//for pradhap college

app.post('/outpass2/:id/accept', async (req, res) => {
  const id = req.params.id;

  try {
    console.log(`Accepting outpass with ID: ${id}...`);

    const updateQuery = `
      UPDATE outpass2
      SET status = 'HOD Accepted'
      WHERE id = $1
      RETURNING *;
    `;
    const updatedOutpass = await client.query(updateQuery, [id]);

    if (updatedOutpass.rows.length === 0) {
      console.error(`Outpass with ID ${id} not found.`);
      return res.status(404).json({ success: false, message: 'Outpass not found' });
    }


    // Fetch the outpass details from the database
    const outpassQuery = `
      SELECT * FROM outpass2 WHERE id = $1;
    `;
    const { rows } = await client.query(outpassQuery, [id]);
    const outpass = rows[0];

    if (!outpass) {
      console.error(`Outpass with ID ${id} not found in the database.`);
      return res.status(404).json({ success: false, message: 'Outpass not found in the database' });
    }


    await sendAcceptanceEmail2(outpass.email, id, outpass.name, outpass.registernumber,outpass.department,outpass.year,outpass.reason);


    res.json({ success: true, email: outpass.email});
  } catch (error) {
    console.error('Error accepting outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while accepting outpass' });
  }
});

// Staff Approval
app.post('/outpass/:id/staff-approve', async (req, res) => {
  const id = req.params.id;
  try {
    // Update staff approval status in the database
    const updateQuery = `
      UPDATE outpass
      SET status = 'Staff Approved'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error approving outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while approving outpass' });
  }
});

//for new college 

// Staff Approval
app.post('/outpass1/:id/staff-approve', async (req, res) => {
  const id = req.params.id;
  try {
    // Update staff approval status in the database
    const updateQuery = `
      UPDATE outpass1
      SET status = 'Staff Approved'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error approving outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while approving outpass' });
  }
});

//for pradhap college 
// staff approval
app.post('/outpass2/:id/staff-approve', async (req, res) => {
  const id = req.params.id;
  try {
    // Update staff approval status in the database
    const updateQuery = `
      UPDATE outpass2
      SET status = 'Staff Approved'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error approving outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while approving outpass' });
  }
});

// Staff Decline
app.post('/outpass/:id/staff-decline', async (req, res) => {
  const id = req.params.id;
  try {
    // Update staff approval status in the database
    const updateQuery = `
      UPDATE outpass
      SET status = 'Staff Declined'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error approving outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while approving outpass' });
  }
});

// Staff Decline
//for new college
app.post('/outpass1/:id/staff-decline', async (req, res) => {
  const id = req.params.id;
  try {
    // Update staff approval status in the database
    const updateQuery = `
      UPDATE outpass1
      SET status = 'Staff Declined'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error approving outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while approving outpass' });
  }
});

// Staff Decline
//for new college
app.post('/outpass2/:id/staff-decline', async (req, res) => {
  const id = req.params.id;
  try {
    // Update staff approval status in the database
    const updateQuery = `
      UPDATE outpass2
      SET status = 'Staff Declined'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error approving outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while approving outpass' });
  }
});

// app.post('/deletee',async(req,res)=>{
//   const deleteQuery = `
//   DELETE FROM outpass
//   WHERE registernumber = '20104035';
// `;
// await client.query(deleteQuery);
// res.json({ success: true });
// })

// app.post('/deletee', async (req, res) => {

//   try {
//     const deleteQuery = `
//     DELETE FROM outpass
//     WHERE registernumber = '20104036';
//   `;
//     await client.query(deleteQuery);
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error declining outpass:', error);
//     res.status(500).json({ success: false, message: 'An error occurred while declining outpass' });
//   }
// });

app.post('/outpass/:id/decline', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const updateQuery = `
      UPDATE outpass
      SET status = 'HOD Declined'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error declining outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while declining outpass' });
  }
});

//for new college 

app.post('/outpass1/:id/decline', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const updateQuery = `
      UPDATE outpass1
      SET status = 'HOD Declined'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error declining outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while declining outpass' });
  }
});

// for pradhap colleg 
app.post('/outpass2/:id/decline', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const updateQuery = `
      UPDATE outpass2
      SET status = 'HOD Declined'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error declining outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while declining outpass' });
  }
});

module.exports = app;
