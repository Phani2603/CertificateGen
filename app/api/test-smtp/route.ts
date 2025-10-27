import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, appPassword } = body
    
    console.log('🔍 Web Test - Testing credentials...')
    console.log(`Email: ${email}`)
    console.log(`Password: ${appPassword.substring(0, 4)}****`)
    console.log(`Password length: ${appPassword.replace(/\s/g, '').length}`)
    
    // Clean inputs (no spaces in password)
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = appPassword.replace(/\s/g, '')
    
    // Always use Gmail SMTP for both gmail.com and .edu.in
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: cleanEmail,
        pass: cleanPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      debug: true,
      logger: true
    })
    
    console.log('🔗 Attempting connection to smtp.gmail.com:587...')
    
    // Test the connection
    await transporter.verify()
    
    console.log('✅ SUCCESS: Connection verified!')
    
    transporter.close()
    
    return NextResponse.json({
      success: true,
      message: 'Connection successful!',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        email: cleanEmail
      }
    })
    
  } catch (error) {
    console.error('❌ FAILED:', error)
    const err = error as any
    
    return NextResponse.json({
      success: false,
      error: err.message || 'Unknown error',
      code: err.code || 'UNKNOWN',
      details: {
        message: err.message,
        code: err.code,
        command: err.command,
        response: err.response,
        responseCode: err.responseCode
      }
    }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SMTP Test Endpoint',
    usage: {
      method: 'POST',
      body: {
        email: 'your-email@domain.com',
        appPassword: 'your-app-password'
      }
    }
  })
}