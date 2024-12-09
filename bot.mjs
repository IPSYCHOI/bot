
// import dotenv from 'dotenv';
// import { Client, GatewayIntentBits } from 'discord.js';
// import { google } from 'googleapis';
// import express from 'express';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import open from 'open';
// import fetch from 'node-fetch'; // Ensure you have 'node-fetch' installed for fetching files

// // Configure dotenv to load environment variables
// dotenv.config();

// // Paths setup
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Discord Bot setup
// const client = new Client({
//   intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
// });

// // Google Drive authentication setup

// const SCOPES = [
//   'https://www.googleapis.com/auth/drive.metadata.readonly',
//   'https://www.googleapis.com/auth/drive.file',  // Required for file uploads
//   'https://www.googleapis.com/auth/drive',      // Optional: broader access to drive
// ];

// const TOKEN_PATH = path.join(__dirname, 'token.json'); // Path to store access token
// const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json'); // Path to your credentials file

// // Initialize the Express server
// const app = express();
// const port = 3000;

// // Function to get the 'Tasks' folder ID
// async function getTasksFolderId(auth) {
//   const drive = google.drive({ version: 'v3', auth });
//   const res = await drive.files.list({
//     q: "name = 'Tasks' and mimeType = 'application/vnd.google-apps.folder'",
//     fields: 'files(id, name)',
//   });

//   console.log('Drive API Response:', res.data.files); // Log the response to see if any folder is returned

//   if (res.data.files.length > 0) {
//     console.log('Found folder:', res.data.files[0].name); // Log the found folder's name
//     return res.data.files[0].id;  // Return the ID of the 'Tasks' folder
//   } else {
//     console.error('Error: Tasks folder not found in Google Drive.');
//     throw new Error('Tasks folder not found in Google Drive.');
//   }
// }



// // Function to list member folders inside 'Tasks'
// async function listMemberFolders(auth, tasksFolderId) {
//   const drive = google.drive({ version: 'v3', auth });
//   const res = await drive.files.list({
//     q: `'${tasksFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
//     fields: 'files(id, name)',
//   });
//   return res.data.files;  // Return list of folders (members)
// }

// // Modified Google Drive upload function to specify folder
// async function uploadFileToGoogleDrive(filePath, fileName, folderId) {
//   const auth = await authenticateGoogle();
//   const drive = google.drive({ version: 'v3', auth });

//   const fileMetadata = {
//     name: fileName,
//     parents: [folderId],  // Upload to the selected member folder
//   };
//   const media = {
//     mimeType: 'application/octet-stream',
//     body: fs.createReadStream(filePath),
//   };

//   await drive.files.create({
//     resource: fileMetadata,
//     media: media,
//     fields: 'id',
//   });
//   console.log('File uploaded to Google Drive');
// }

// // Google OAuth 2.0 authentication
// async function authenticateGoogle() {
//   const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
//   const { client_secret, client_id, redirect_uris } = credentials.web;
//   const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//   if (fs.existsSync(TOKEN_PATH)) {
//     const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
//     oAuth2Client.setCredentials(token);
//   } else {
//     return oAuth2Client;
//   }
//   return oAuth2Client;
// }

// // Express server handling Google OAuth redirect
// app.get('/auth/google', async (req, res) => {
//   const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
//   const { client_secret, client_id, redirect_uris } = credentials.web;
//   const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES,
//   });

//   res.redirect(authUrl);
// });

// app.get('/auth/google/callback', async (req, res) => {
//   const { code } = req.query;
//   const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
//   const { client_secret, client_id, redirect_uris } = credentials.web;
//   const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

//   try {
//     const { tokens } = await oAuth2Client.getToken(code);
//     oAuth2Client.setCredentials(tokens);

//     // Store the token for later use
//     fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
//     res.send('Authentication successful! You can now close this page.');
//   } catch (error) {
//     console.error('Error during authentication', error);
//     res.send('Authentication failed!');
//   }
// });

// // Start the Express server
// app.listen(port, () => {
//   console.log(`Server started at http://bot-production-7bb6.up.railway.app:${port}`);
//   (async () => {
//     await open(`http://bot-production-7bb6.up.railway.app:${port}/auth/google`);
//   })();
// });

// // Discord bot event listener
// client.on('messageCreate', async (message) => {
//   if (message.author.bot) return;

//   if (message.content.startsWith('!submit')) {
//     const file = message.attachments.first();
//     if (file) {
//       const auth = await authenticateGoogle(); // Authenticate with Google API
//       const tasksFolderId = await getTasksFolderId(auth); // Get 'Tasks' folder ID
//       const memberFolders = await listMemberFolders(auth, tasksFolderId); // Get member folders

//       if (memberFolders.length > 0) {
//         let folderList = 'Please select your folder by replying with your name:\n';
//         memberFolders.forEach((folder) => {
//           folderList += `${folder.name} \n`;
//         });

//         message.reply(folderList);

//         // Wait for the user's reply with their folder name
//         const filter = (response) => response.author.id === message.author.id;
//         const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });

//         const selectedFolderName = collected.first().content.trim();
//         const selectedFolder = memberFolders.find((folder) => folder.name === selectedFolderName);

//         if (selectedFolder) {
//           // Proceed with uploading the file to the selected folder
//           const filePath = path.join(__dirname, file.name);
//           const fileStream = fs.createWriteStream(filePath);

//           try {
//             const response = await fetch(file.url);
//             if (!response.ok) {
//               throw new Error('Failed to fetch the file');
//             }

//             response.body.pipe(fileStream);

//             fileStream.on('finish', async () => {
//               try {
//                 await uploadFileToGoogleDrive(filePath, file.name, selectedFolder.id);
//                 message.reply('Your task has been submitted successfully!');
//               } catch (error) {
//                 console.error('Error uploading file to Google Drive:', error);
//                 message.reply('Failed to submit your task. Please try again.');
//               }
//               fs.unlinkSync(filePath); // Remove the file after upload
//             });
//           } catch (error) {
//             console.error('Error downloading the file:', error);
//             message.reply('Failed to download the file. Please try again.');
//           }
//         } else {
//           message.reply('Folder not found. Please check your folder name.');
//         }
//       } else {
//         message.reply('No member folders found in the "Tasks" folder.');
//       }
//     } else {
//       message.reply('Please attach a file with your task.');
//     }
//   }
// });

// // Log in the Discord bot
// client.login(process.env.BOT_TOKEN);
import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import { google } from 'googleapis';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import fetch from 'node-fetch'; // Ensure you have 'node-fetch' installed for fetching files

// Configure dotenv to load environment variables
dotenv.config();

// Paths setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Discord Bot setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Google Drive authentication setup
const SCOPES = [
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.file',  // Required for file uploads
  'https://www.googleapis.com/auth/drive',      // Optional: broader access to drive
];

const TOKEN_PATH = path.join(__dirname, 'token.json'); // Path to store access token
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json'); // Path to your credentials file

// Initialize the Express server
const app = express();
const port = 3000;

// Function to get the 'Tasks' folder ID
async function getTasksFolderId(auth) {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: "name = 'Tasks' and mimeType = 'application/vnd.google-apps.folder'",
    fields: 'files(id, name)',
  });

  console.log('Drive API Response:', res.data.files); // Log the response to see if any folder is returned

  if (res.data.files.length > 0) {
    console.log('Found folder:', res.data.files[0].name); // Log the found folder's name
    return res.data.files[0].id;  // Return the ID of the 'Tasks' folder
  } else {
    console.error('Error: Tasks folder not found in Google Drive.');
    throw new Error('Tasks folder not found in Google Drive.');
  }
}

// Function to list member folders inside 'Tasks'
async function listMemberFolders(auth, tasksFolderId) {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: `'${tasksFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
    fields: 'files(id, name)',
  });
  return res.data.files;  // Return list of folders (members)
}

// Modified Google Drive upload function to specify folder
async function uploadFileToGoogleDrive(filePath, fileName, folderId) {
  const auth = await authenticateGoogle();
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: fileName,
    parents: [folderId],  // Upload to the selected member folder
  };
  const media = {
    mimeType: 'application/octet-stream',
    body: fs.createReadStream(filePath),
  };

  await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });
  console.log('File uploaded to Google Drive');
}

// Google OAuth 2.0 authentication
async function authenticateGoogle() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
  } else {
    return oAuth2Client;
  }
  return oAuth2Client;
}

// Express server handling Google OAuth redirect
app.get('/auth/google', async (req, res) => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Store the token for later use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    res.send('Authentication successful! You can now close this page.');
  } catch (error) {
    console.error('Error during authentication', error);
    res.send('Authentication failed!');
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
  
  // Only open the URL in development, not production
  if (process.env.NODE_ENV !== 'production') {
    open(`http://localhost:${port}/auth/google`);
  } else {
    // In production, log the URL so users can open it manually
    console.log(`Please open the following URL in your browser:`);
    console.log(`http://bot-production-7bb6.up.railway.app:${port}/auth/google`);
  }
});

// Discord bot event listener
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!submit')) {
    const file = message.attachments.first();
    if (file) {
      const auth = await authenticateGoogle(); // Authenticate with Google API
      const tasksFolderId = await getTasksFolderId(auth); // Get 'Tasks' folder ID
      const memberFolders = await listMemberFolders(auth, tasksFolderId); // Get member folders

      if (memberFolders.length > 0) {
        let folderList = 'Please select your folder by replying with your name:\n';
        memberFolders.forEach((folder) => {
          folderList += `${folder.name} \n`;
        });

        message.reply(folderList);

        // Wait for the user's reply with their folder name
        const filter = (response) => response.author.id === message.author.id;
        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });

        const selectedFolderName = collected.first().content.trim();
        const selectedFolder = memberFolders.find((folder) => folder.name === selectedFolderName);

        if (selectedFolder) {
          // Proceed with uploading the file to the selected folder
          const filePath = path.join(__dirname, file.name);
          const fileStream = fs.createWriteStream(filePath);

          try {
            const response = await fetch(file.url);
            if (!response.ok) {
              throw new Error('Failed to fetch the file');
            }

            response.body.pipe(fileStream);

            fileStream.on('finish', async () => {
              try {
                await uploadFileToGoogleDrive(filePath, file.name, selectedFolder.id);
                message.reply('Your task has been submitted successfully!');
              } catch (error) {
                console.error('Error uploading file to Google Drive:', error);
                message.reply('Failed to submit your task. Please try again.');
              }
              fs.unlinkSync(filePath); // Remove the file after upload
            });
          } catch (error) {
            console.error('Error downloading the file:', error);
            message.reply('Failed to download the file. Please try again.');
          }
        } else {
          message.reply('Folder not found. Please check your folder name.');
        }
      } else {
        message.reply('No member folders found in the "Tasks" folder.');
      }
    } else {
      message.reply('Please attach a file with your task.');
    }
  }
});

// Log in the Discord bot
client.login(process.env.BOT_TOKEN);
