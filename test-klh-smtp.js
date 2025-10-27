const nodemailer = require('nodemailer');

async function testKLHSMTP() {
  const email = '2320030451@klh.edu.in';
  const appPassword = 'auih qnqv nnyr gyzw';
  const domain = 'klh.edu.in';
  
  console.log('🔍 Testing KLH SMTP configurations...\n');
  
  const configurations = [
    { host: 'smtp.gmail.com', port: 587, secure: false, name: 'Gmail for Education' },
    { host: `mail.${domain}`, port: 587, secure: false, name: `mail.${domain}` },
    { host: `smtp.${domain}`, port: 587, secure: false, name: `smtp.${domain}` },
    { host: `mail.${domain}`, port: 465, secure: true, name: `mail.${domain}:465 (SSL)` },
    { host: `mail.${domain}`, port: 25, secure: false, name: `mail.${domain}:25` },
    { host: `webmail.${domain}`, port: 587, secure: false, name: `webmail.${domain}` },
    { host: 'smtp.office365.com', port: 587, secure: false, name: 'Office365/Outlook' },
  ];
  
  for (const config of configurations) {
    let transporter = null;
    
    try {
      console.log(`⏳ Testing ${config.name}...`);
      
      transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: email,
          pass: appPassword.replace(/\s/g, '')
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
        tls: {
          rejectUnauthorized: false
        },
        debug: true, // Enable debug mode
        logger: true
      });
      
      // Test connection
      await transporter.verify();
      
      console.log(`✅ SUCCESS: ${config.name} works!`);
      console.log(`   Host: ${config.host}:${config.port} (secure: ${config.secure})\n`);
      
      transporter.close();
      break; // Stop at first successful configuration
      
    } catch (error) {
      console.log(`❌ FAILED: ${config.name}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code || 'N/A'}\n`);
      
      if (transporter) {
        transporter.close();
      }
    }
  }
  
  console.log('🏁 Testing complete.');
}

// Run the test
testKLHSMTP().catch(console.error);