import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

async function runCheck() {
  console.log('----------------------------------------------------');
  console.log('🔍 RAJASTHAN EXAM TWISTER — SYSTEM HEALTH DIAGNOSTIC');
  console.log('----------------------------------------------------');

  // 1. Telegram Bot Check
  const token = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  const dryRun = process.env.TELEGRAM_DRY_RUN;

  console.log('\n[1/3] TELEGRAM BOT STATUS:');
  console.log('  • Bot Token Provided:', token ? 'YES (Masked: ' + token.substring(0, 4) + '...' + token.substring(token.length - 4) + ')' : 'NO');
  console.log('  • Target Chat ID:', chatId);
  console.log('  • Publish Safety Mode:', dryRun === 'false' ? '🔴 LIVE BROADCAST MODE' : '🛡️ DRY RUN (Simulation)');

  if (token) {
    try {
      const resp = await axios.get(`https://api.telegram.org/bot${token}/getMe`, { timeout: 8000 });
      if (resp.data && resp.data.ok) {
        console.log('  • Telegram Connection: ✅ ACTIVE & VERIFIED');
        console.log('  • Bot Name:', resp.data.result.first_name);
        console.log('  • Bot Username: @' + resp.data.result.username);
      }
    } catch (err: any) {
      console.log('  • Telegram Connection: ❌ Error (' + (err.response?.data?.description || err.message) + ')');
    }
  }

  // 2. MongoDB Atlas Check
  console.log('\n[2/3] MONGODB DATABASE STATUS:');
  const mongoUri = process.env.MONGODB_URI;
  console.log('  • URI Configured:', mongoUri ? 'YES (Remote Atlas Cluster)' : 'NO');

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
      console.log('  • MongoDB Connection: ✅ CONNECTED SUCCESSFULLY');
      const collections = await mongoose.connection.db?.listCollections().toArray();
      console.log('  • Active Collections in Database:', collections?.map((c) => c.name).join(', ') || 'None (fresh db)');
      await mongoose.disconnect();
    } catch (err: any) {
      console.log('  • MongoDB Connection: ❌ Connection Error (' + err.message + ')');
    }
  }

  // 3. Security & Admin Configuration
  console.log('\n[3/3] SECURITY & AUTH CONFIGURATION:');
  console.log('  • JWT Secret Configured:', process.env.JWT_SECRET ? '✅ YES' : '❌ NO');
  console.log('  • Admin Password Configured:', process.env.ADMIN_PASSWORD ? '✅ YES' : '❌ NO');
  console.log('  • Server Port:', process.env.PORT || 5000);

  console.log('\n----------------------------------------------------');
  console.log('🎉 COMPLETE SYSTEM CHECK FINISHED');
  console.log('----------------------------------------------------');
}

runCheck();
