// EmailJS Configuration
// To set up EmailJS for sending postcards:

// 1. Go to https://www.emailjs.com/ and create an account
// 2. Create an Email Service (Gmail, Outlook, etc.)
// 3. Create an Email Template
// 4. Get your credentials and update the values below

export const emailConfig = {
  // Your actual EmailJS credentials
  serviceId: 'service_mcuabpd', // Updated to use new postcard Gmail account
  templateId: 'template_cii7st9',
  publicKey: 'RGH-CUU6DYlRogpFv',
};

// Email Template Variables:
// - to_email: Recipient's email address
// - to_name: Recipient's name
// - from_email: Sender's email address (for display only)
// - from_handle: Sender's handle
// - message: Postcard message
// - postcard_image: Generated postcard image (base64)
// - subject: Email subject

// Example EmailJS Template:
/*
Subject: {{subject}}

Hello {{to_name}},

You received a beautiful digital postcard from @{{from_handle}} ({{from_email}})!

Message:
{{message}}

The postcard is attached to this email as an image that you can download and save to your gallery.

Best regards,
PostCard Team
*/

// QUICK SETUP INSTRUCTIONS:
// 1. Sign up at https://www.emailjs.com/
// 2. Create a new Email Service (choose Gmail)
// 3. Create a new Email Template with the variables above
// 4. Copy your Service ID, Template ID, and Public Key
// 5. Replace the placeholder values in this file
// 6. Test sending a postcard!
