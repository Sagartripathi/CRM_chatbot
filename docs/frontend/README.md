# ⚛️ Frontend Documentation

Documentation for the CRM Chatbot React/TypeScript frontend.

---

## 🛠 Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Shadcn/UI** - Component library
- **React Router** - Navigation
- **Axios** - API calls
- **React Hook Form** - Form handling
- **Zod** - Schema validation

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/      → React components
│   │   ├── ui/         → Reusable UI components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── LeadManagement.tsx
│   │   ├── CampaignManagement.tsx
│   │   ├── MeetingManagement.tsx
│   │   └── SupportTickets.tsx
│   ├── contexts/       → React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/          → Custom hooks
│   ├── lib/            → Utilities
│   ├── types/          → TypeScript types
│   ├── config.ts       → Configuration
│   ├── App.tsx         → Main app component
│   └── index.tsx       → Entry point
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── craco.config.js
```

---

## 🚀 Quick Start

### Local Development

```bash
cd frontend

# Install dependencies
yarn install

# Start development server
yarn start

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
yarn build

# Output in: build/
```

---

## 🔧 Configuration

### API Configuration

The frontend uses environment-based API URLs configured in `src/config.ts`:

**Development:**

```typescript
// Automatically uses http://localhost:8000
```

**Production:**

```bash
# Set in Vercel environment variables
REACT_APP_API_URL=https://your-backend.onrender.com
```

### Environment Variables

| Variable            | Description     | Required        |
| ------------------- | --------------- | --------------- |
| `REACT_APP_API_URL` | Backend API URL | Production only |

---

## 📦 Main Components

### Authentication

- **Login.tsx** - Login form with validation
- **AuthContext.tsx** - Auth state management
- Uses JWT tokens stored in localStorage

### Dashboard

- **Dashboard.tsx** - Main dashboard view
- Shows analytics and quick stats
- Navigation to all sections

### Features

- **LeadManagement.tsx** - Lead CRUD operations
- **CampaignManagement.tsx** - Campaign management
- **MeetingManagement.tsx** - Meeting scheduler
- **SupportTickets.tsx** - Ticket system
- **CallInterface.tsx** - Call handling

### Layout

- **Layout.tsx** - Main layout wrapper
- **GlobalSidebar.tsx** - Navigation sidebar

---

## 🎨 UI Components

Located in `src/components/ui/`:

### Core Components

- `button.tsx` - Button component
- `input.tsx` - Input fields
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialogs
- `table.tsx` - Data tables
- `form.jsx` - Form components

### Data Display

- `badge.tsx` - Status badges
- `avatar.jsx` - User avatars
- `skeleton.jsx` - Loading skeletons
- `progress.jsx` - Progress bars

### Navigation

- `tabs.tsx` - Tab navigation
- `dropdown-menu.jsx` - Dropdown menus
- `navigation-menu.jsx` - Navigation

---

## 🔐 Authentication Flow

```typescript
// 1. User logs in
const { login } = useAuth();
await login(email, password);

// 2. Token stored in localStorage
localStorage.setItem("token", access_token);

// 3. Token sent with every API request
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// 4. Protected routes check auth
if (!user) redirect("/login");
```

---

## 🌐 API Integration

### Using AuthContext

```typescript
import { useAuth } from "./contexts/AuthContext";

function Component() {
  const { user, login, logout } = useAuth();

  // Use apiClient for authenticated requests
  const response = await apiClient.get("/api/leads");
}
```

### Direct API Calls

```typescript
import axios from "axios";
import { API_BASE_URL } from "./config";

const response = await axios.get(`${API_BASE_URL}/api/endpoint`);
```

---

## 📱 Responsive Design

The app is fully responsive using Tailwind CSS:

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 🧪 Testing

```bash
# Run tests
yarn test

# Type checking
yarn type-check

# Linting
yarn lint
yarn lint:fix
```

---

## 🚀 Deployment

See [../deployment/](../deployment/) for complete deployment guides.

### Quick Deploy to Vercel

1. Set Root Directory: `frontend`
2. Add env var: `REACT_APP_API_URL`
3. Deploy!

---

## 🔧 Troubleshooting

### Common Issues

**Issue: Can't connect to backend**

```bash
# Check API URL in config.ts
# Verify REACT_APP_API_URL in production
```

**Issue: CORS errors**

```bash
# Update backend CORS_ORIGINS
# Include your frontend URL
```

**Issue: Build fails**

```bash
# Clear cache and rebuild
rm -rf node_modules yarn.lock
yarn install
yarn build
```

---

## 📚 Additional Resources

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn/UI](https://ui.shadcn.com)
- [Deployment Guide](../deployment/START_DEPLOYMENT_HERE.md)

---

## 🎯 Development Tips

1. **Hot Reload**: Save files to see changes instantly
2. **TypeScript**: Use proper types for better DX
3. **Components**: Keep components small and focused
4. **State**: Use Context for global state
5. **Styling**: Use Tailwind utilities
6. **Testing**: Write tests for critical paths

---

**Need help? Check the main [docs README](../README.md) or deployment guides!**
