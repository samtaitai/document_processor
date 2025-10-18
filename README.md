# 📄 Smart Document Processor

> An intelligent cloud-based document processing system that automatically extracts, analyzes, and provides insights from uploaded documents in real-time.

[![Azure Functions](https://img.shields.io/badge/Azure-Functions-0078D4?style=flat&logo=microsoft-azure)](https://azure.microsoft.com/en-us/services/functions/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat&logo=vue.js)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎯 What This Does

Transform any document (PDF, Word, Text) into actionable insights with just one click:

- **Upload** documents via drag-and-drop or click
- **Automatic Processing** extracts text and analyzes content
- **Instant Insights** including word count, reading time, and key topics
- **Smart Search** finds important keywords automatically
- **History Tracking** keeps all your processed documents organized

**Perfect for:** Content analysis, document summarization, research, compliance reviews, and data extraction.

---

## ✨ Key Features

### 🚀 **Intelligent Processing**
- Supports PDF, DOCX, DOC, and TXT files
- Automatic text extraction using industry-standard libraries
- Real-time processing with progress tracking
- Extracts metadata: word count, character count, reading time

### 🔍 **Smart Analysis**
- **Keyword Extraction** - Identifies the 10 most important terms
- **Content Summary** - Generates quick overviews
- **Full Text Access** - Complete extracted content available
- **Statistical Insights** - Reading time estimation and content metrics

### 🎨 **Modern User Experience**
- Clean, intuitive interface
- Drag-and-drop file upload
- Real-time status updates
- Responsive design (works on mobile and desktop)
- Beautiful animations and transitions

---

## 🏗️ Architecture

Built with modern serverless architecture for scalability and reliability:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Vue.js Frontend                                        │
│  • Modern, reactive UI                                  │
│  • Real-time status updates                             │
│  • Local storage integration                            │
│                                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ REST API (HTTP/JSON)
                 │
┌────────────────▼────────────────────────────────────────┐
│                                                         │
│  Azure Functions (Serverless Backend)                   │
│  ├─ Upload Handler        (HTTP Trigger)                │
│  ├─ Document Processor    (Queue Trigger)               │
│  ├─ Results API          (HTTP Trigger)                 │
│  └─ List Documents       (HTTP Trigger)                 │
│                                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Async Message Queue
                 │
┌────────────────▼────────────────────────────────────────┐
│                                                         │
│  Azure Storage                                          │
│  ├─ Blob Storage         (File storage)                 │
│  ├─ Queue Storage        (Message queue)                │
│  └─ Processed Results    (JSON data)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Why This Architecture?

- **Serverless** - Scales automatically, pay only for what you use
- **Async Processing** - Non-blocking operations for better performance
- **Microservices** - Each function has a single responsibility
- **Cloud-Native** - Built for Azure, but portable to other clouds
- **Event-Driven** - Reactive system responds to user actions instantly

---

## 🛠️ Technology Stack

### Frontend
- **Vue.js 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend tooling
- **Native JavaScript** - No heavy dependencies
- **CSS3** - Modern, responsive styling

### Backend
- **Azure Functions** - Serverless compute platform
- **Node.js 20** - JavaScript runtime
- **Azure Blob Storage** - Scalable object storage
- **Azure Queue Storage** - Reliable message queue

### Processing Libraries
- **pdf-parse** - PDF text extraction
- **mammoth** - Word document (.docx) processing
- **Native parsing** - Text file handling

### Development Tools
- **Azurite** - Local Azure Storage emulator
- **Azure Functions Core Tools** - Local function testing
- **npm** - Package management

---

## 🚀 Getting Started (Local Development)

### Prerequisites
```bash
Node.js 20.x
Azure Functions Core Tools v4
```

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd document-processor

# Install backend dependencies
cd functions
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally
```bash
# Terminal 1: Start local storage emulator
cd functions
npm run storage

# Terminal 2: Start Azure Functions
cd functions
npm start

# Terminal 3: Start frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser!

---

## 📈 Potential Enhancements

### Short-term
- 🌐 Multi-language support (detect document language)
- 📊 Advanced analytics (sentiment analysis, entity extraction)
- 🔐 User authentication and private storage
- 📧 Email notifications when processing completes

### Long-term
- 🤖 AI-powered summarization using GPT models
- 📑 Batch processing for multiple files
- 🔗 API for third-party integrations
- 📱 Native mobile applications
- 🌍 Multi-region deployment for global users
