# OTP Service — Self-Hosted OTP Verification

A professional, self-hosted, open-source OTP verification system for both **Phone (SMS)** and **Email**. Built with a modern, high-performance tech stack.

![Project Preview](https://raw.githubusercontent.com/devendradilliwar/otp-service/main/preview.png)

## 🚀 Tech Stack

### Backend
- **Framework**: [Hono](https://hono.dev/) (Node.js)
- **Language**: TypeScript
- **Database**: [Neon](https://neon.tech/) (PostgreSQL)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Cache**: [Redis](https://redis.io/)
- **Gateways**: Fast2SMS (SMS) & Resend (Email)

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## ✨ Features
- **Dual Channel**: Support for both SMS and Email OTP.
- **Secure**: Cryptographically strong OTPs and session tokens.
- **Rate Limited**: Built-in protection against brute-force and spamming.
- **Audit Logs**: Every action is logged to PostgreSQL for auditing.
- **Session Tracking**: Automatic session generation upon successful verification.
- **Premium UI**: Clean, responsive, and dark-mode ready interface.

## 📁 Project Structure
- `/backend`: The Hono API service.
- `/frontend`: The Next.js verification interface.

## 🛠️ Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your Neon, Redis, Fast2SMS, and Resend keys
npm run db:push
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Docker Setup (Alternative)
If you have Docker installed, you can run the entire stack with:
```bash
docker-compose up --build
```
*Note: You still need to fill in the `.env` files in both directories before running Docker.*

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author
**Devendra Dilliwar**
- GitHub: [@devendradilliwar](https://github.com/devendradilliwar)
