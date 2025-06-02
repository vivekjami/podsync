# PodSync 🎙️
### *Next-Gen AI-Powered Podcast Recording Studio*

> **Built by Vivek Jami** - A full-stack engineer passionate about creating production-grade applications that solve real problems.

---

## 🚀 What is PodSync?

PodSync is my answer to the question: "What if we could build something better than Riverside.fm?" 

This isn't just another video conferencing tool - it's a complete podcasting ecosystem that I've architected from the ground up. The platform supports **up to 10 participants** in real-time calls while simultaneously recording studio-quality audio locally. What makes it special? The AI magic that happens after your recording ends - automatic transcription, speaker identification, audio cleanup, and intelligent summaries.

This project represents my journey from being comfortable with traditional web development to diving deep into the complex worlds of WebRTC, real-time media processing, and AI integration. Every line of code tells a story of late nights, breakthrough moments, and the satisfaction of solving incredibly challenging problems.

## ✨ Why I Built This

As someone who's worked extensively with React, Next.js, and Django, I wanted to push my boundaries. I've built fintech tools, decentralized applications, and won hackathons, but PodSync was my chance to tackle something that combines everything I love about software engineering:

- **Real-time Systems**: WebRTC for live streaming
- **AI Integration**: Whisper, pyannote-audio, and GPT for post-processing  
- **Scalable Architecture**: Designed to handle 10+ participants reliably
- **Production-Grade Infrastructure**: Docker, GCP Cloud Run, CI/CD pipelines
- **Modern Frontend**: Next.js with TypeScript and Tailwind CSS

## 🏗️ Architecture That Scales

### **The Challenge: 10-Person Calls**
Supporting 10 people in a single call isn't just about connecting more peers - it's about completely rethinking the architecture. Here's how I solved it:

**Selective Forwarding Unit (SFU) Architecture**
- Peer-to-peer works great for 2-3 people, but becomes a nightmare with 10
- Each participant would need 9 connections = 45 total connections for 10 people
- My solution: Implement a media server (Mediasoup) that receives streams from all participants and selectively forwards them

**Dual-Quality Streams**  
- **Real-time**: Lower bitrate for live conversation (optimized for latency)
- **Recording**: High bitrate local recording for studio quality (optimized for quality)

**Smart Bandwidth Management**
- Dynamic quality adaptation based on network conditions
- Priority system: audio > active speaker video > other participants
- Background upload throttling during live sessions

### **Tech Stack Decisions**

**Frontend: Next.js + TypeScript**
- Server-side rendering for better SEO and performance
- Type safety throughout the application
- Tailwind CSS for rapid, consistent styling
- Socket.IO for real-time communication

**Backend: Node.js + Express**
- WebSocket server for WebRTC signaling
- RESTful APIs for session management
- MongoDB for user data and session metadata
- Google Cloud Storage for media files

**Media Processing**
- **Mediasoup**: Open-source SFU for scalable real-time communication
- **FFmpeg**: Audio/video processing and layout rendering
- **OpenAI Whisper**: State-of-the-art speech recognition
- **Pyannote-audio**: Speaker diarization and identification

**AI Pipeline**
- **Transcription**: Whisper handles 680k+ hours of training data
- **Speaker ID**: Pyannote identifies who said what
- **Audio Cleanup**: Noise reduction and normalization
- **Summarization**: GPT-4 generates session highlights

**Infrastructure**
- **Docker**: Containerized deployment
- **GCP Cloud Run**: Serverless container hosting
- **GitHub Actions**: Automated CI/CD
- **Vercel**: Frontend deployment
- **Stripe**: Payment processing

---

## 🛠️ Running PodSync Locally

### Prerequisites
```bash
# Make sure you have these installed
node -v  # v18.0.0 or higher
npm -v   # v8.0.0 or higher
docker --version
git --version
```

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/vivekjami/podsync.git
cd podsync

# 2. Install dependencies
# Frontend
cd frontend && npm install

# Backend  
cd ../backend && npm install

# 3. Environment Setup
cp .env.example .env.local  # Frontend
cp .env.example .env        # Backend

# 4. Start development servers
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev

# 5. Visit http://localhost:3000
```

### Environment Variables You'll Need
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SOCKET_URL=ws://localhost:8080
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Backend (.env)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
STRIPE_SECRET_KEY=sk_test_...
GCP_PROJECT_ID=your-project-id
GCP_STORAGE_BUCKET=your-bucket-name
OPENAI_API_KEY=sk-...
```

### Database Setup
```bash
# MongoDB Atlas (recommended for development)
# 1. Create free cluster at https://cloud.mongodb.com
# 2. Get connection string
# 3. Add to MONGODB_URI in .env

# Local MongoDB (alternative)
docker run -d -p 27017:27017 --name podsync-mongo mongo:latest
```

---

## 📚 My Learning Journey

### **WebRTC: From "Simple" to "Holy Complexity"**

When I started, I thought WebRTC was just about connecting two browsers. How hard could it be?

**The Reality Check**: WebRTC is a maze of protocols, signaling servers, STUN/TURN servers, ICE candidates, and NAT traversal. My first "successful" connection only worked on localhost. The moment I tried it across different networks, everything broke.

**The Breakthrough**: Understanding that WebRTC is not just peer-to-peer. For 10-person calls, you need an SFU (Selective Forwarding Unit). I spent weeks learning about media servers, studying Mediasoup documentation, and implementing proper fallback mechanisms.

**Key Learning**: Real-time communication is incredibly complex, but the user experience should feel effortless.

### **The Resumable Upload Challenge**

Picture this: You just recorded a 2-hour podcast with 10 people. That's potentially 20GB of high-quality media files. Now imagine your upload fails at 95% completion.

**The Problem**: Traditional file uploads don't handle large files gracefully. Network interruptions, browser crashes, or simply closing the tab would mean starting over.

**The Solution**: I implemented the TUS (Transloadit Upload Server) protocol with chunked uploads:
- Split large files into 5-10MB chunks
- Upload chunks in parallel with retry logic
- Store upload state in IndexedDB for crash recovery
- Resumable from any point of failure

**The Tools**: Uppy.js with Golden Retriever plugin became my best friend. It handles all the complexity while providing a beautiful upload UI.

**Key Learning**: User experience is everything. Nobody should lose their content due to technical failures.

### **AI Integration: Making Computers Understand Speech**

Integrating AI wasn't just about calling an API - it was about building a reliable pipeline that processes hours of audio content.

**Whisper Integration**:
- Handles multilingual content (supports 99+ languages)
- Robust against background noise and varying audio quality
- Processes individual tracks vs. mixed audio for better accuracy

**Speaker Diarization Challenge**:
- Whisper gives you text, but not who said what
- Pyannote-audio identifies speaker segments
- The magic happens in aligning timestamps between the two

**Processing Pipeline**:
```
Audio Files → FFmpeg Processing → Whisper (Transcription) 
                                ↓
Speaker Segments ← Pyannote-audio
                                ↓
Combined Transcript → GPT-4 (Summarization)
```

**Key Learning**: AI is powerful, but the real value is in the integration and user experience around it.

### **Scaling to 10 Participants: The Architecture Evolution**

**Attempt 1: Peer-to-Peer Mesh**
- Works great for 2-3 people
- Becomes exponentially complex with more participants
- Network requirements: n(n-1)/2 connections
- For 10 people: 45 connections! Each person uploads to 9 others.

**Attempt 2: SFU (Selective Forwarding Unit)**
- One media server receives all streams
- Selectively forwards streams to participants
- Each participant: 1 upload + 9 downloads
- Much more efficient and scalable

**Implementation Reality**:
- Set up Mediasoup server for media routing
- Handle dynamic participant joining/leaving
- Implement bandwidth adaptation
- Manage audio/video quality layers

**Key Learning**: Sometimes you need to completely rethink your approach to scale.

---

## 🎯 Features That Make PodSync Special

### **🎥 Real-Time Multi-Participant Calls**
- **Up to 10 participants** in a single session
- **Dynamic video layouts** that adapt to screen sharing
- **Active speaker detection** with visual indicators
- **Bandwidth optimization** for different network conditions

### **🎙️ Studio-Quality Recording**
- **Dual-path recording**: Low-bitrate for live + high-bitrate for quality
- **Individual track recording** for each participant
- **Lossless audio capture** using MediaRecorder API
- **Automatic sync** across all recorded tracks

### **🤖 AI-Powered Post-Processing**
- **Automatic transcription** with 99+ language support
- **Speaker identification** - know who said what
- **Audio enhancement** - noise reduction and normalization  
- **AI-generated summaries** with key highlights
- **Searchable transcripts** with timestamp navigation

### **💾 Enterprise-Grade Reliability**
- **Resumable uploads** survive network failures and browser crashes
- **Crash recovery** using Service Workers and local storage
- **Real-time session monitoring** and participant management
- **Detailed analytics** and usage tracking

### **💳 Production-Ready Infrastructure**
- **Stripe integration** for subscriptions and pay-per-session
- **Role-based access control** (Host, Guest, Admin)
- **Containerized deployment** with Docker and GCP Cloud Run
- **Automated CI/CD** with GitHub Actions
- **Comprehensive monitoring** and error tracking

---

## 🚀 Deployment Architecture

### **Development Workflow**
```
Local Development → GitHub Push → Automated Tests → Build & Deploy
```

### **Production Stack**
- **Frontend**: Vercel (auto-deploy from main branch)
- **Backend**: GCP Cloud Run (containerized Node.js)
- **Database**: MongoDB Atlas (managed cluster)
- **Storage**: Google Cloud Storage (media files)
- **CDN**: Vercel Edge Network
- **Monitoring**: GCP Cloud Logging + Sentry

### **CI/CD Pipeline**
```yaml
# Simplified workflow
name: Deploy PodSync
on: [push to main]
jobs:
  test-and-deploy:
    - Run TypeScript checks
    - Run unit tests
    - Build Docker image
    - Deploy to Cloud Run
    - Run integration tests
    - Notify deployment status
```

---

## 📊 Current Status & Roadmap

### ✅ **Completed Features**
- [x] 10-person WebRTC calls with SFU architecture
- [x] High-quality local recording for all participants
- [x] Screen sharing with dynamic layouts
- [x] Resumable chunked uploads with crash recovery
- [x] AI transcription and speaker identification
- [x] Audio enhancement and noise reduction
- [x] Session management and real-time analytics
- [x] Stripe payment integration
- [x] Responsive UI with real-time feedback
- [x] Docker deployment with CI/CD

### 🚧 **Currently Working On**
- [ ] Mobile app support (React Native)
- [ ] Advanced video layouts and effects
- [ ] Real-time collaboration features
- [ ] Enhanced admin dashboard

### 🔮 **Future Vision**
- [ ] Live streaming to social platforms
- [ ] AI-powered content recommendations
- [ ] Multi-language support expansion
- [ ] Integration with popular podcast platforms
- [ ] Advanced analytics and insights

---

## 🧪 Testing Strategy

### **Unit Tests**
- Backend API endpoints
- WebRTC signaling logic
- File upload handling
- AI processing pipelines

### **Integration Tests**
- End-to-end call scenarios
- Upload and processing workflows
- Payment processing flows
- Cross-browser compatibility

### **Performance Tests**
- 10-participant call stability
- Large file upload reliability
- AI processing speed
- Database query optimization

---

## 🤝 Why This Project Showcases My Skills

### **Technical Depth**
- **Real-time Systems**: Deep understanding of WebRTC, signaling, and media processing
- **AI Integration**: Practical experience with modern AI models and pipelines
- **Scalable Architecture**: Designed systems that handle real-world complexity
- **Production Deployment**: Complete DevOps pipeline with monitoring and reliability

### **Problem-Solving Approach**
- **Research-Driven**: Studied existing solutions and identified improvement opportunities
- **Iterative Development**: Started simple, gradually added complexity
- **User-Focused**: Every technical decision prioritizes user experience
- **Performance-Conscious**: Optimized for real-world usage patterns

### **Modern Development Practices**
- **Type Safety**: TypeScript throughout frontend and backend
- **Clean Architecture**: Separation of concerns and maintainable code
- **Testing Strategy**: Comprehensive unit and integration tests
- **Documentation**: Clear README, API docs, and deployment guides

---

## 📞 Let's Connect - I'm Looking for My Next Challenge

Building PodSync has been an incredible journey that's pushed me far beyond my comfort zone. From my background in fintech tools and blockchain applications to tackling real-time media processing and AI integration, this project represents my growth as an engineer.

**What I bring to your team:**
- **Full-Stack Expertise**: MERN, Next.js, TypeScript, Python/Django
- **Complex System Design**: WebRTC, real-time communications, media processing
- **AI/ML Integration**: Practical experience with modern AI pipelines
- **Production Mindset**: Reliability, monitoring, scalability from day one
- **Continuous Learning**: Comfortable diving into new technologies and domains

**Recent Experience:**
- Software Engineer at Rompit Technologies (Jan 2024 - Feb 2025)
- Multiple hackathon wins including 2nd place in Global Encode Hackathon
- Advanced Solidity Bootcamp graduate (Extropy)
- Built 6+ production applications across fintech and blockchain domains

**My Approach:**
- Start with user needs, not technology choices
- Build for production from the beginning
- Learn rapidly and adapt to new challenges
- Balance innovation with proven patterns

## 📬 Get in Touch

If PodSync demonstrates the kind of thinking and execution you're looking for on your team, I'd love to discuss how I can contribute to your organization's success.

**Contact Information:**
- 📧 **Email**: j.vivekvamsi@gmail.com
- 💼 **LinkedIn**: [linkedin.com/in/vivek-jami](https://linkedin.com/in/vivek-jami/)
- 🐙 **GitHub**: [github.com/vivekjami](https://github.com/vivekjami)


**Currently Available For:**
- Full-time software engineering roles
- Contract/freelance projects
- Technical consulting
- Speaking engagements about WebRTC or AI integration

---

## 📄 License

MIT License - Feel free to explore, learn from, and build upon this project.

---

## 🙏 Acknowledgments

Special thanks to the open-source community whose tools made this possible:
- **Mediasoup** team for excellent WebRTC SFU implementation
- **OpenAI** for Whisper and GPT models
- **Pyannote** team for speaker diarization tools
- **Vercel** and **Google Cloud** for reliable hosting platforms

---

*Built with ❤️, countless cups of coffee, and the determination to solve hard problems.*

> "The best way to predict the future is to invent it." - Alan Kay

**P.S.** - If you made it this far, you're exactly the kind of detail-oriented person I'd love to work with! 🚀



