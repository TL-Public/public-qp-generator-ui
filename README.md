# Smart Question Paper Generator (SmartQP)

A SvelteKit application for creating and managing exam question papers with authentication and dynamic question generation.

## 🚀 Tech Stack

- **Framework:** SvelteKit
- **Styling:** TailwindCSS
- **State Management:** Svelte Stores
- **Authentication:** JWT-based
- **API Integration:** REST API

## 🌐 API Configuration

### Base URL
```
http://13.126.201.63:8000/v1
```

### API Endpoints

```javascript
// Authentication
POST /login              // User login
POST /register          // User registration

// Question Management
GET /questions          // Get all questions
GET /questions/:id      // Get question by ID
GET /question_types     // Get question types
POST /question_papers   // Create question paper

// Subject & Chapter Management
GET /subjects          // Get all subjects
GET /mediums          // Get all mediums
GET /chapters_topics  // Get chapters and topics
```

## 📚 Project Structure

```bash
src/
├── lib/
│   ├── components/
│   │   ├── ActionBar.svelte
│   │   ├── Card.svelte
│   │   ├── ChapterSelector.svelte
│   │   ├── DifficultyDistribution.svelte
│   │   ├── ExamConfig.svelte
│   │   ├── Header.svelte
│   │   ├── QuestionsList.svelte
│   │   └── ReviewPage.svelte
│   ├── stores/
│   │   ├── authStore.js      # Authentication state
│   │   ├── paperStore.js     # Paper management
│   │   └── questionStore.js  # Question state
│   └── utils/
│       └── api.js           # API integration
├── routes/
│   ├── +layout.svelte      # Root layout
│   ├── +page.svelte       # Landing page
│   ├── login/
│   │   └── +page.svelte
│   ├── register/
│   │   └── +page.svelte
│   └── (protected)/       # Protected routes
│       ├── +layout.svelte
│       ├── create-paper/
│       └── papers/
```

## 🔐 Authentication

Uses JWT-based authentication with token storage in:
- localStorage for persistence
- cookie for SSR support

```javascript
// Example auth configuration
const authConfig = {
  tokenKey: 'token',
  cookieOptions: {
    path: '/',
    maxAge: 86400
  }
};
```

## 🔧 Development Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_BASE_URL=http://13.126.201.63:8000/v1
```

4. Start development server:
```bash
npm run dev
```

## 📡 API Integration

The project uses a proxy configuration for API calls:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/v1': {
        target: 'http://13.126.201.63:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

## 🚀 Protected Routes

Protected routes are handled using SvelteKit's route groups:
- All routes under `(protected)/` require authentication
- Unauthorized access redirects to login
- Authentication state managed via `authStore`

## 📝 Question Paper Creation Flow

1. User Authentication
2. Subject/Medium Selection
3. Chapter/Topic Selection
4. Question Configuration
5. Paper Generation
6. Review & Download

## 🔄 Data Models

### Question Paper Payload
```typescript
interface QuestionPaper {
  exam_name: string;
  exam_type_code: string;  // Default: '1000' for MCQ
  exam_mode: string;
  total_time: number;
  total_questions: number;
  no_of_versions: number;
  no_of_sets: number;
  subject_code: string;
  medium_code: string;
  standard: string;
  qns: Array<{
    type: 'chapter' | 'topic';
    codes: string[];
    qtn_codes_to_exclude: string[];
  }>;
}
```

## 🛠️ Production Build

1. Build the application:
```bash
npm run build
```

2. Preview the build:
```bash
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push branch (`git push origin feature/name`)
5. Create Pull Request

## 📄 License

MIT License