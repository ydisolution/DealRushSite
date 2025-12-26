/**
 * Gmail OAuth2 Refresh Token Generator
 * This script helps you get a new refresh token for Gmail
 */

import { google } from 'googleapis';
import * as readline from 'readline';

const SCOPES = ['https://mail.google.com/'];

async function getNewRefreshToken() {
  console.log('\n🔐 Gmail OAuth2 Refresh Token Generator\n');
  
  // Read client credentials from environment
  const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
  const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
  
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Missing credentials!');
    console.error('Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file');
    process.exit(1);
  }
  
  console.log('✅ Found credentials in .env file');
  console.log(`   Client ID: ${CLIENT_ID.substring(0, 20)}...`);
  console.log('');
  
  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob' // For desktop apps
  );
  
  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh token
  });
  
  console.log('📋 Steps to get your refresh token:\n');
  console.log('1. Open this URL in your browser:');
  console.log('\x1b[36m%s\x1b[0m', authUrl);
  console.log('\n2. Sign in with: office.dealrush@gmail.com');
  console.log('3. Grant permissions');
  console.log('4. Copy the authorization code\n');
  
  // Ask for the code
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('5. Paste the authorization code here: ', async (code) => {
    try {
      console.log('\n🔄 Exchanging code for tokens...');
      
      const { tokens } = await oauth2Client.getToken(code);
      
      if (tokens.refresh_token) {
        console.log('\n✅ Success! Your new refresh token:\n');
        console.log('\x1b[32m%s\x1b[0m', tokens.refresh_token);
        console.log('\n📝 Add this to your .env file:');
        console.log('\x1b[33m%s\x1b[0m', `GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('\n💡 Then restart your server');
      } else {
        console.error('\n❌ No refresh token received!');
        console.error('This might happen if you already authorized this app before.');
        console.error('Try revoking access first at: https://myaccount.google.com/permissions');
        console.error('Then run this script again.');
      }
    } catch (error) {
      console.error('\n❌ Error getting token:', error);
    } finally {
      rl.close();
    }
  });
}

getNewRefreshToken().catch(console.error);
