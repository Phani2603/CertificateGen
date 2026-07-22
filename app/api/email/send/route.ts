import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getProviderById, validateProviderConfig } from '@/lib/email-providers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, to, subject, body: emailBody, cc, bcc } = body

    // Validate required fields
    if (!providerId || !to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get provider configuration
    const provider = getProviderById(providerId)
    if (!provider) {
      return NextResponse.json(
        { error: 'Invalid email provider' },
        { status: 400 }
      )
    }

    // Validate provider credentials (server-side)
    const config = validateProviderConfig(provider)
    if (!config.valid) {
      return NextResponse.json(
        {
          error: 'Provider credentials not configured',
          missingVars: config.missingVars,
        },
        { status: 500 }
      )
    }

    // Get credentials from environment
    const user = process.env[`${provider.envPrefix}_USER`]
    const password = process.env[`${provider.envPrefix}_PASSWORD`]

    if (!user || !password) {
      return NextResponse.json(
        { error: 'Provider credentials missing' },
        { status: 500 }
      )
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: provider.host,
      port: provider.port,
      secure: provider.secure, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: {
        user,
        pass: password,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })

    console.log('Attempting to connect to:', {
      provider: provider.name,
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      user,
      method: provider.secure ? 'SSL/TLS' : 'STARTTLS',
    })

    // Verify connection configuration
    try {
      await transporter.verify()
      console.log('SMTP connection verified successfully')
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError)
      return NextResponse.json(
        {
          error: 'Failed to connect to email server',
          details: verifyError instanceof Error ? verifyError.message : 'Unknown error',
          provider: provider.displayName,
          host: provider.host,
          port: provider.port,
        },
        { status: 500 }
      )
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"${provider.displayName}" <${provider.email}>`,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'), // Simple HTML conversion
    })

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      provider: provider.name,
      to,
      subject,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      provider: provider.displayName,
    })
  } catch (error) {
    console.error('Email send error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
