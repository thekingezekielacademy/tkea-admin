# King Ezekiel Academy

A modern educational platform built with React and Node.js, featuring comprehensive course management, user authentication, and interactive learning experiences.

## 🚀 Features

- **User Authentication**: Secure login/registration with role-based access control
- **Course Management**: Create, edit, and manage educational courses
- **Lesson System**: Structured learning content with multimedia support
- **User Profiles**: Personalized user experience with profile management
- **Responsive Design**: Modern, mobile-friendly interface
- **Real-time Updates**: Live data synchronization with Supabase

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **State Management**: React Context API

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── lib/         # Utility functions
│   └── public/           # Static assets
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── index.js         # Server entry point
├── supabase/             # Database migrations and functions
└── index.html            # Landing page

```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5000
NODE_ENV=development
```

### Installation

1. **Install server dependencies:**
   ```bash
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd client && npm install
   ```

3. **Set up Supabase:**
   - Create a new Supabase project
   - Run the migrations in the `supabase/migrations/` folder
   - Update your environment variables

### Running the Application

1. **Start the backend server:**
   ```bash
   npm start
   ```

2. **Start the frontend (in a new terminal):**
   ```bash
   cd client && npm start
   ```

3. **Or run both simultaneously:**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The application uses Supabase with the following main tables:

- **profiles**: User profiles and information
- **courses**: Course details and metadata
- **lessons**: Individual lesson content
- **progress**: User progress tracking
- **certificates**: Achievement certificates

## 🔐 Authentication

Authentication is handled entirely through Supabase Auth, providing:

- Secure user registration and login
- Session management
- Role-based access control
- Password reset functionality

## 📱 API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create new course
- `GET /api/lessons` - Get lessons for a course
- `POST /api/lessons` - Create new lesson

## 🎨 Customization

- Modify Tailwind CSS classes in `client/src/index.css`
- Update component styles in individual component files
- Customize the landing page in `index.html`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🚀 Deployment Status

- ✅ **Local Development**: Running on localhost:3000 & localhost:5000
- ✅ **GitHub Pages**: Deployed at https://thekingezekielacademy.github.io/-king-ezekiel-academy
- 🔄 **Vercel**: Configuration ready, awaiting deployment
- 📋 **Namecheap**: Deployment guide prepared

## About

 Modern educational platform built with React, TypeScript, and Supabase 