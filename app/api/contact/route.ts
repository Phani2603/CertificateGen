import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ContactForm from '@/models/ContactForm';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, message } = body;

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Save to database
    const contactForm = await ContactForm.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
      status: 'new',
      emailSent: false,
    });

    // Send email notification from forge@senement.com to support@gocertiflo.com
    let emailSent = false;
    let emailError = null;
    
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.CORPORATE_EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.CORPORATE_EMAIL_PORT || '587'),
        secure: process.env.CORPORATE_EMAIL_SECURE === 'true',
        auth: {
          user: process.env.CORPORATE_EMAIL_USER,
          pass: process.env.CORPORATE_EMAIL_PASSWORD ? process.env.CORPORATE_EMAIL_PASSWORD.replace(/\s/g, '') : '',
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      const mailOptions = {
        from: `"Certiflo Contact Form" <${process.env.CORPORATE_EMAIL_USER || 'forge@senement.com'}>`,
        to: 'support@gocertiflo.com',
        replyTo: email,
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #21808D 0%, #1a6370 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📧 New Contact Form</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Certiflo Website</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #21808D; margin-top: 0;">Contact Details</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold; width: 120px;">Name:</td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">Email:</td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0;">
                    <a href="mailto:${email}" style="color: #21808D; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">Submitted:</td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0;">${new Date().toLocaleString('en-US', { 
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}</td>
                </tr>
              </table>

              <div style="margin: 25px 0;">
                <h3 style="color: #333; margin-bottom: 10px;">Message:</h3>
                <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #21808D; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word;">
                  ${message}
                </div>
              </div>

              <div style="background: #f0f9ff; border-left: 4px solid #21808D; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #555;">
                  <strong>💡 Quick Actions:</strong><br>
                  • Reply directly to this email to respond to ${name}<br>
                  • View all submissions in the admin dashboard<br>
                  • Mark as read/replied once handled
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin" 
                   style="display: inline-block; padding: 12px 30px; background: #21808D; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View in Admin Dashboard
                </a>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #888; font-size: 12px;">
              <p style="margin: 5px 0;">Certiflo - Certificate Generation Platform</p>
              <p style="margin: 5px 0;">This is an automated notification from the contact form</p>
            </div>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);

      // Update contact form record
      contactForm.emailSent = true;
      contactForm.emailSentAt = new Date();
      await contactForm.save();
      emailSent = true;

      console.log('[ContactForm] Email sent successfully to support@gocertiflo.com');
    } catch (error) {
      console.error('[ContactForm] Failed to send email:', error);
      emailError = error instanceof Error ? error.message : 'Unknown error';
      // Don't fail the request if email fails, form is still saved
    }

    return NextResponse.json(
      {
        success: true,
        message: emailSent 
          ? 'Thank you for contacting us! We\'ll get back to you soon.'
          : 'Your message has been saved. We\'ll get back to you soon. (Note: Email notification failed)',
        emailSent,
        emailError,
        data: {
          id: contactForm._id,
          name: contactForm.name,
          email: contactForm.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[ContactForm] Submission error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit contact form. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint for admin to fetch all contact forms
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const contactForms = await ContactForm.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await ContactForm.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: contactForms,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit,
      },
    });
  } catch (error) {
    console.error('[ContactForm] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact forms' },
      { status: 500 }
    );
  }
}
