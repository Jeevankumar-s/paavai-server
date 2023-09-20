require('dotenv').config();
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');

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

const sendAcceptanceEmail = (studentEmail, id, studentName, registerNo) => {
  const doc = new PDFDocument();

  // Load the college logo image and college image
  try {
    const collegeLogoPath = './images/paavailogo.jpeg'; // Replace with the actual path to your college's logo
    const collegeImagePath = './images/building.jpeg'; // Replace with the actual path to your college image

    // Embed the college logo at the top left corner
    const logoImage = fs.readFileSync(collegeLogoPath);
    doc.image(logoImage, 50, 50, { width: 100 }); // Adjust the coordinates and width as needed

    // Embed the college image in the center of the page
    const collegeImage = fs.readFileSync(collegeImagePath);
    doc.image(collegeImage, { align: 'center', valign: 'center' });
  } catch (error) {
    console.error('Error reading images:', error);
    return;
  }

  // Add college name at the top of the page
  doc.fontSize(16).text('Paavai Engineering College', { align: 'center' });
  doc.fontSize(14).text('Pachal, Namakkal', { align: 'center' });

  // Add content to the PDF
  // Center the student name horizontally
  const studentNameWidth = doc.widthOfString(`Student Name: ${studentName}`);
  const studentNameX = (doc.page.width - studentNameWidth) / 2;

  doc.fontSize(14).text('Outpass Acceptance', { align: 'center' });
  doc.fontSize(12).text(`Student Name: ${studentName}`, studentNameX);
  doc.fontSize(12).text(`Register No: ${registerNo}`);
  
  // Include both date and time of acceptance
  const now = new Date();
  const acceptanceDateTime = now.toLocaleString();

  doc.fontSize(12).text(`Date and Time of Acceptance: ${acceptanceDateTime}`, { align: 'center' });

  // Set the watermark text
  const watermarkText = 'JEEV PASS';

  // Calculate watermark size and position to center it on the page
  const watermarkWidth = doc.widthOfString(watermarkText);
  const watermarkHeight = doc.currentLineHeight();
  const watermarkX = (doc.page.width - watermarkWidth) / 3;
  const watermarkY = (doc.page.height - watermarkHeight) / 2;

  // Set the rotation angle for the watermark (tilt left)
  const watermarkRotation = -45; // Negative angle for left tilt

  // Add the rotated watermark to the PDF
  doc.rotate(watermarkRotation, { origin: [watermarkX, watermarkY] })
     .fontSize(48)
     .fillOpacity(0.3)
     .text(watermarkText, watermarkX, watermarkY, { align: 'center' });

  // Generate and add the digital signature
  const signature = generateDigitalSignature(studentName);
  doc.fontSize(12).text(`Digital Signature: ${signature}`, { align: 'center' });

  // Stream the PDF content to a buffer
  const pdfBuffer = [];
  doc.on('data', (chunk) => {
    pdfBuffer.push(chunk);
  });

  doc.on('end', () => {
    const pdfData = Buffer.concat(pdfBuffer);

    const mailOptions = {
      from: 'pavaioutpass@gmail.com',
      to: studentEmail,
      subject: 'Outpass Accepted',
      text: `Your outpass with ID ${id} has been accepted.`,
      attachments: [
        {
          filename: 'outpass_acceptance.pdf',
          content: pdfData,
          contentType: 'application/pdf',
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  });

  // End the PDF document
  doc.end();
};

// Example usage:
sendAcceptanceEmail('ananthkeerthi4@gmail.com', 1, 'ananth', 'ABC1234');
