// Quick test script to verify Resend API configuration
// Run with: node test-resend.js
const { Resend } = require('resend')

// Manually set your API key here for testing
const RESEND_API_KEY = 're_GYi3Amiv_LLfL1PrRt81MFqpdq78JAEwF'
const RESEND_FROM_EMAIL = 'onboarding@resend.dev'

const resend = new Resend(RESEND_API_KEY)

async function testResend() {
  console.log('Testing Resend configuration...')
  console.log('API Key:', RESEND_API_KEY ? '✓ Set' : '✗ Missing')
  console.log('From Email:', RESEND_FROM_EMAIL)
  
  try {
    console.log('\nSending test email...')
    const response = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: '2320030229@klh.edu.in', // Change this to your test email
      subject: 'Test Email from Certificate Generator',
      html: '<h1>Test Email</h1><p>If you receive this, your Resend configuration is working!</p>',
    })
    
    console.log('✓ Email sent successfully!')
    console.log('Message ID:', response.data?.id)
    console.log('\nCheck your inbox (and spam folder) for the test email.')
  } catch (error) {
    console.error('✗ Error sending email:', error.message)
    console.error('Full error:', error)
  }
}

testResend()
