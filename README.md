# PostCard - Digital Postcard Creator

A beautiful, interactive web application that allows users to create and send digital postcards with personal messages, photos, and signatures.

## ✨ Features

- **User Setup**: Personalized profile creation with name, handle, and profile image
- **Interactive Postcard Creation**: Real-time preview as you type
- **Signature Drawing**: Draw your signature using mouse or touch
- **Photo Upload**: Attach images to your postcards
- **AI Stamp Integration**: Profile images converted to custom postage stamps (placeholder ready)
- **Email Functionality**: Send postcards directly via email with downloadable images
- **Responsive Design**: Works seamlessly on all devices

## 🎯 User Flow

1. **Setup Page**: Enter your name, handle, and upload a profile picture
2. **PostCard Creation**: Fill in the form and see real-time preview
3. **Personalization**: Draw your signature and upload photos
4. **Send**: Deliver your digital postcard via email with downloadable image

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM
- **Styling**: CSS3 with modern design principles
- **State Management**: React Context API
- **Canvas**: HTML5 Canvas for signature drawing
- **Email Service**: EmailJS for sending postcards
- **Responsive**: Mobile-first design approach

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- EmailJS account (for email functionality)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd postcard-app
```

2. Install dependencies:
```bash
npm install
```

3. **Configure EmailJS** (Required for sending postcards):
   - Go to [EmailJS](https://www.emailjs.com/) and create an account
   - Create an Email Service (Gmail, Outlook, etc.)
   - Create an Email Template with these variables:
     - `{{to_email}}` - Recipient's email
     - `{{to_name}}` - Recipient's name
     - `{{from_handle}}` - Sender's handle
     - `{{message}}` - Postcard message
     - `{{postcard_image}}` - Generated postcard image
     - `{{subject}}` - Email subject
   - Update `src/config/emailConfig.ts` with your credentials

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## 📧 EmailJS Setup Guide

### Step 1: Create EmailJS Account
1. Visit [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account

### Step 2: Create Email Service
1. Go to "Email Services" in your dashboard
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the authentication steps
5. Copy the Service ID

### Step 3: Create Email Template
1. Go to "Email Templates" in your dashboard
2. Click "Create New Template"
3. Use this template structure:

```
Subject: {{subject}}

Hello {{to_name}},

You received a beautiful digital postcard from @{{from_handle}}!

Message:
{{message}}

The postcard is attached to this email as an image that you can download and save to your gallery.

Best regards,
PostCard Team
```

4. Copy the Template ID

### Step 4: Get Public Key
1. Go to "Account" → "API Keys"
2. Copy your Public Key

### Step 5: Update Configuration
1. Open `src/config/emailConfig.ts`
2. Replace the placeholder values with your actual credentials:
```typescript
export const emailConfig = {
  serviceId: 'your_actual_service_id',
  templateId: 'your_actual_template_id',
  publicKey: 'your_actual_public_key',
};
```

## 📱 Features in Detail

### Setup Page
- Clean, modern interface for user onboarding
- Profile image upload with preview
- Form validation and error handling

### PostCard Creation
- **Left Column**: Input form with all necessary fields including recipient name
- **Right Column**: Real-time postcard preview
- **Front Side**: Message content with AI stamp and signature
- **Back Side**: Full-frame photo display

### Signature System
- Interactive canvas for drawing signatures
- Touch and mouse support
- Clear and redraw functionality

### Photo Management
- Drag and drop image upload
- Preview functionality
- Responsive image display

### Email System
- Generates downloadable postcard images
- Sends via EmailJS service
- Includes all postcard content and styling

## 🎨 Design Principles

- **Minimalist**: Clean, uncluttered interface
- **Interactive**: Real-time feedback and previews
- **Accessible**: Screen reader friendly and keyboard navigable
- **Responsive**: Mobile-first design approach
- **Modern**: Contemporary UI/UX patterns

## 🔮 Future Enhancements

- [x] AI-powered stamp generation using ChatGPT
- [ ] Multiple photo support (up to 4 images)
- [ ] Postcard templates and themes
- [ ] Social sharing capabilities
- [ ] Postcard history and management
- [ ] Advanced email customization

## 📁 Project Structure

```
postcard-app/
├── src/
│   ├── components/
│   │   ├── SetupPage.tsx
│   │   ├── PostCardPage.tsx
│   │   ├── SignatureCanvas.tsx
│   │   └── *.css
│   ├── context/
│   │   └── UserContext.tsx
│   ├── config/
│   │   └── emailConfig.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
├── package.json
└── README.md
```

## 🤝 Contributing

This is a prototype project. Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by traditional postcard culture
- Built with modern web technologies
- Designed for memorable digital communication
- Email functionality powered by EmailJS

---

**Happy PostCarding!** 📮✨
