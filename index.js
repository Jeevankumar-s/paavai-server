require('dotenv').config();
const express = require('express');
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
const { format } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');
const app = express();
app.use(express.json());
app.use(cors()); 
const PORT = process.env.PORT || 3303;
const corsOptions = {
  origin: 'https://paavaioutpass.ccbp.tech',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

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
    CREATE TABLE IF NOT EXISTS outpass (
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

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PASS,
    },
  });

  const generateDigitalSignature = (studentName) => {
    const secretKey = 'JEEVANKUMAR';
    const signature = crypto.createHmac('sha256', secretKey).update(studentName).digest('hex');
    return signature;
  };

   
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
      const jwtToken = jwt.sign({ username }, "JEEVANKUMARKIRUTHIKA", { expiresIn: '1h' });
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

app.get('/delete', async(req,res)=>{
  const delQuery=`select * from login;`;
  const resu=await client.query(delQuery)
  res.send(resu)
})

app.get('/history',async(req,res)=>{
  const historyQuery=`select * from outpass`
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

app.get('/outpass/:id', async (req, res) =>{
  const {id}=req.params
  console.log(id)
  const rquery=`select * from outpass where id=${id};`;
  const results= await client.query(rquery)
  res.send(results.rows)
})

const sendAcceptanceEmail = async (studentEmail, id, studentName, registerNo) => {
  const doc = new PDFDocument();

  try {
    const collegeLogoPath = './images/paavailogo.jpeg'; 
    const collegeImagePath = './images/building.jpeg'; 

    const logoImage = fs.readFileSync(collegeLogoPath);
    doc.image(logoImage, 50, 50, { width: 100 }); 

    const collegeImage = fs.readFileSync(collegeImagePath);
    doc.image(collegeImage, { align: 'center', valign: 'center' });

    doc.fontSize(16).text('Paavai Engineering College', { align: 'center' });
    doc.fontSize(14).text('Pachal, Namakkal', { align: 'center' });

    const studentNameWidth = doc.widthOfString(`Student Name: ${studentName}`);
    const studentNameX = (doc.page.width - studentNameWidth) / 2;

    doc.fontSize(14).text('Outpass Acceptance', { align: 'center' });
    doc.fontSize(12).text(`Student Name: ${studentName}`, studentNameX);
    doc.fontSize(12).text(`Register No: ${registerNo}`);
    
    const now = new Date();
    const acceptanceDateTime = now.toLocaleString();

    doc.fontSize(12).text(`Date and Time of Acceptance: ${acceptanceDateTime}`, { align: 'center' });

    const watermarkText = 'JEEV PASS';

    const watermarkWidth = doc.widthOfString(watermarkText);
    const watermarkHeight = doc.currentLineHeight();
    const watermarkX = (doc.page.width - watermarkWidth) / 3;
    const watermarkY = (doc.page.height - watermarkHeight) / 2;

    const watermarkRotation = -45; // Negative angle for left tilt

    doc.rotate(watermarkRotation, { origin: [watermarkX, watermarkY] })
       .fontSize(48)
       .fillOpacity(0.3)
       .text(watermarkText, watermarkX, watermarkY, { align: 'center' });

    const signature = generateDigitalSignature(studentName);
    doc.fontSize(12).text(`Digital Signature: ${signature}`, { align: 'center' });

    // End the PDF document
    doc.end();

    // Convert the PDF to a buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });

    // Send the email
    const mailOptions = {
      from: 'pavaioutpass@gmail.com',
      to: studentEmail,
      subject: 'Outpass Accepted',
      text: `Your outpass with ID ${id} has been accepted.`,
      attachments: [
        {
          filename: 'outpass_acceptance.pdf',
          content: pdfBuffer, // Attach the PDF buffer
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





// app.post('/outpass/:id/accept', async (req, res) => {
//   const id = parseInt(req.params.id);

//   try {
//     const updateQuery = `
//       UPDATE outpass
//       SET status = 'accepted'
//       WHERE id = $1;
//     `;
//     await client.query(updateQuery, [id]);
//     const outpassQuery = `
//     SELECT * FROM outpass WHERE id = $1;
//   `;
//   const { rows } = await client.query(outpassQuery, [id]);
//   const outpass = rows[0];

//     res.json({ success: true });
//     sendAcceptanceEmail(outpass.email, id, outpass.name, outpass.registernumber);
//   } catch (error) {
//     console.error('Error accepting outpass:', error);
//     res.status(500).json({ success: false, message: 'An error occurred while accepting outpass' });
//   }
// });

app.post('/outpass/:id/accept', async (req, res) => {
  const id = (req.params.id);

  try {
    const updateQuery = `
      UPDATE outpass
      SET status = 'accepted'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [id]);
    
    // Fetch the outpass details from the database
    const outpassQuery = `
      SELECT * FROM outpass WHERE id = $1;
    `;
    const { rows } = await client.query(outpassQuery, [id]);
    const outpass = rows[0];

    if (!outpass) {
      return res.status(404).json({ success: false, message: 'Outpass not found' });
    }

    sendAcceptanceEmail(outpass.email, id, outpass.name, outpass.registernumber);

    res.json({ success: true });
  } catch (error) {
    console.error('Error accepting outpass:', error);
    res.status(500).json({ success: false, message: 'An error occurred while accepting outpass' });
  }
});



app.post('/outpass/:id/decline', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const updateQuery = `
      UPDATE outpass
      SET status = 'declined'
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
