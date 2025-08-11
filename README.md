# PostCard - Digital Postcard Creator

A beautiful, interactive web application that allows users to create and send digital postcards with personal messages, photos, and signatures.

## ✨ Features

- **User Setup**: Personalized profile creation with name, handle, and profile image
- **Interactive Postcard Creation**: Real-time preview as you type
- **Signature Drawing**: Draw your signature using mouse or touch
- **Photo Upload**: Attach images to your postcards
- **AI Stamp Integration**: Profile images converted to custom postage stamps (placeholder ready)
- **Email Functionality**: Send postcards directly via email
- **Responsive Design**: Works seamlessly on all devices

## 🎯 User Flow

1. **Setup Page**: Enter your name, handle, and upload a profile picture
2. **PostCard Creation**: Fill in the form and see real-time preview
3. **Personalization**: Draw your signature and upload photos
4. **Send**: Deliver your digital postcard via email

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM
- **Styling**: CSS3 with modern design principles
- **State Management**: React Context API
- **Canvas**: HTML5 Canvas for signature drawing
- **Responsive**: Mobile-first design approach

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

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

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## 📱 Features in Detail

### Setup Page
- Clean, modern interface for user onboarding
- Profile image upload with preview
- Form validation and error handling

### PostCard Creation
- **Left Column**: Input form with all necessary fields
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

## 🎨 Design Principles

- **Minimalist**: Clean, uncluttered interface
- **Interactive**: Real-time feedback and previews
- **Accessible**: Screen reader friendly and keyboard navigable
- **Responsive**: Mobile-first design approach
- **Modern**: Contemporary UI/UX patterns

## 🔮 Future Enhancements

- [ ] AI-powered stamp generation using ChatGPT
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

---

**Happy PostCarding!** 📮✨
