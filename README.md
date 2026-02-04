# AI Calendar Assistant

A full-stack AI-powered calendar and productivity application built with React, Node.js, Express, and MongoDB. Features natural language processing for event creation, voice commands, habit tracking, diet management, and smart scheduling.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [License](#license)

## Features

### Core Functionality
- **Smart Calendar Management** - Create, edit, and manage events with AI-assisted scheduling
- **Natural Language Processing** - Add events using conversational input (e.g., "Meeting tomorrow at 3pm")
- **Voice Assistant** - Hands-free event and task creation using Web Speech API
- **Conflict Detection** - Automatic detection and resolution of scheduling conflicts

### Productivity Tools
- **Task Management** - Priority-based task tracking with due dates and categories
- **Habit Tracker** - Daily habit monitoring with streak calculations and progress visualization
- **Smart Reminders** - Customizable reminders with snooze functionality and repeat options

### Health and Wellness
- **Diet and Nutrition Tracking** - Log meals, track macronutrients, and monitor water intake
- **AI Diet Advisor** - Personalized nutrition recommendations based on goals

### User Experience
- **Glassmorphism UI** - Modern, translucent design with smooth animations
- **Dark Theme** - Eye-friendly interface optimized for extended use
- **Responsive Design** - Seamless experience across desktop and mobile devices
- **Customizable Settings** - Personalized preferences for notifications, themes, and AI behavior

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| TailwindCSS | Styling |
| FullCalendar | Calendar Component |
| Lucide React | Icons |
| React Router | Navigation |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JSON Web Token | Authentication |
| Groq SDK | AI Integration (Llama 3.1) |

## Project Structure

```
ai-calender/
|-- backend/
|   |-- src/
|   |   |-- ai/
|   |   |   |-- aiController.js
|   |   |-- config/
|   |   |   |-- db.js
|   |   |-- controllers/
|   |   |   |-- auth.controller.js
|   |   |   |-- dashboard.controller.js
|   |   |   |-- diet.controller.js
|   |   |   |-- event.controller.js
|   |   |   |-- habit.controller.js
|   |   |   |-- reminder.controller.js
|   |   |   |-- smart.controller.js
|   |   |   |-- task.controller.js
|   |   |-- middleware/
|   |   |   |-- auth.middleware.js
|   |   |-- models/
|   |   |   |-- Diet.js
|   |   |   |-- Event.js
|   |   |   |-- Habit.js
|   |   |   |-- ProductivityLog.js
|   |   |   |-- Reminder.js
|   |   |   |-- Task.js
|   |   |   |-- User.js
|   |   |-- routes/
|   |   |   |-- aiRoutes.js
|   |   |   |-- auth.routes.js
|   |   |   |-- dashboard.routes.js
|   |   |   |-- diet.routes.js
|   |   |   |-- event.routes.js
|   |   |   |-- habit.routes.js
|   |   |   |-- reminder.routes.js
|   |   |   |-- smart.routes.js
|   |   |   |-- task.routes.js
|   |   |-- server.js
|   |-- package.json
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- layout/
|   |   |   |   |-- MainLayout.jsx
|   |   |   |   |-- Sidebar.jsx
|   |   |   |   |-- TopBar.jsx
|   |   |   |-- AddEventModal.jsx
|   |   |   |-- ErrorBoundary.jsx
|   |   |-- pages/
|   |   |   |-- AIAssistant.jsx
|   |   |   |-- Calendar.jsx
|   |   |   |-- DashboardHome.jsx
|   |   |   |-- Diet.jsx
|   |   |   |-- Habits.jsx
|   |   |   |-- Login.jsx
|   |   |   |-- Register.jsx
|   |   |   |-- Reminders.jsx
|   |   |   |-- Settings.jsx
|   |   |   |-- Tasks.jsx
|   |   |-- App.jsx
|   |   |-- index.css
|   |   |-- main.jsx
|   |-- vercel.json
|   |-- package.json
|
|-- README.md
```

## Installation

### Prerequisites
- Node.js 18.0 or higher
- MongoDB 6.0 or higher (local installation or MongoDB Atlas)
- Groq API Key (obtain from https://console.groq.com)

### Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/sdas45-tech/ai-calender.git
   cd ai-calender
   ```

2. **Backend Configuration**
   ```bash
   cd backend
   npm install
   ```
   
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ai-calendar
   JWT_SECRET=your-secure-secret-key
   GROQ_API_KEY=your-groq-api-key
   PORT=5000
   ```

3. **Frontend Configuration**
   ```bash
   cd frontend
   npm install
   ```
   
   Create a `.env` file in the frontend directory (optional for local development):
   ```env
   VITE_API_BASE=http://localhost:5000/api
   ```

4. **Start Development Servers**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   
   Open http://localhost:5173 in your browser

## Configuration

### Environment Variables

#### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | Secret key for JWT token generation | Yes |
| GROQ_API_KEY | API key for Groq AI services | Yes |
| PORT | Server port (default: 5000) | No |

#### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_BASE | Backend API base URL | Yes (production) |

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Authenticate user |
| GET | /api/auth/profile | Get user profile |
| PUT | /api/auth/profile | Update user profile |
| PUT | /api/auth/password | Change password |
| GET | /api/auth/settings | Get user settings |
| PUT | /api/auth/settings | Update user settings |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/events | Get all events |
| POST | /api/events | Create event |
| GET | /api/events/:id | Get single event |
| PUT | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | Get all tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| PATCH | /api/tasks/:id/complete | Mark task complete |

### Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/habits | Get all habits |
| POST | /api/habits | Create habit |
| PUT | /api/habits/:id | Update habit |
| DELETE | /api/habits/:id | Delete habit |
| POST | /api/habits/:id/log | Log habit completion |

### Reminders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reminders | Get all reminders |
| POST | /api/reminders | Create reminder |
| PUT | /api/reminders/:id | Update reminder |
| DELETE | /api/reminders/:id | Delete reminder |
| PATCH | /api/reminders/:id/snooze | Snooze reminder |

### Diet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/diet/profile | Get diet profile |
| PUT | /api/diet/profile | Update diet profile |
| POST | /api/diet/meals | Log meal |
| POST | /api/diet/water | Log water intake |
| GET | /api/diet/daily | Get daily summary |
| POST | /api/diet/ai-advice | Get AI diet advice |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/ask | Send message to AI |
| POST | /api/ai/create-event | Create event via AI |
| GET | /api/ai/suggestions | Get AI suggestions |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Get dashboard data |
| GET | /api/dashboard/insights | Get productivity insights |
| GET | /api/dashboard/free-slots | Get available time slots |

## Deployment

### Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variable:
   - `VITE_API_BASE`: Your deployed backend URL with `/api` suffix
4. Deploy

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
4. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string
   - `GROQ_API_KEY`: Your Groq API key
   - `PORT`: 5000
5. Deploy

### Database Setup (MongoDB Atlas)

1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user with read/write permissions
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Copy the connection string and add to backend environment variables

## License

This project is licensed under the MIT License.

## Author

Sibam Das - [GitHub](https://github.com/sdas45-tech)
