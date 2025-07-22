# Canvas LMS AI Workshop

A sample application demonstrating AI integration with Canvas LMS, featuring three distinct components: a React frontend and two backend services (Python and JavaScript) that provide identical APIs for AI completions and Canvas LMS data access.

## 🚀 Features

### AI Integration
- **Single Message Completions**: Get AI responses for individual prompts
- **Multi-message Chat Conversations**: Engage in back-and-forth conversations with AI
- **Streaming Responses**: Real-time AI responses using Server-Sent Events
- **AWS Bedrock Integration**: Powered by Amazon Nova Pro model (`us.amazon.nova-pro-v1:0`)

### Canvas LMS Integration
- **Smart Search**: Search Canvas recipients and content
- **Course Management**: Access user courses and enrollment data
- **Student Data**: Retrieve student information with avatar URLs
- **User Profiles**: Get current Canvas user information
- **Health Checks**: Monitor Canvas API connectivity

### Frontend Features
- **Modern React 19**: Latest React with modern JSX syntax
- **Instructure UI Components**: Educational-focused UI component library
- **Client-side Routing**: Navigation powered by Page.js
- **Responsive Design**: Tailwind CSS 4 styling with PostCSS
- **Development Tools**: Biome for linting and formatting

## 🏗️ Architecture

### Frontend
- **Build System**: Rsbuild (modern webpack alternative)
- **Framework**: React 19
- **UI Library**: Instructure UI
- **Styling**: Tailwind CSS 4
- **Routing**: Page.js
- **Code Quality**: Biome

### Backend Services
Two identical API services with different implementations:

#### Python API (FastAPI)
- **Framework**: FastAPI with automatic OpenAPI documentation
- **Type Safety**: Pydantic models for request/response validation
- **AWS SDK**: boto3 for Bedrock integration
- **Canvas Client**: Custom requests-based Canvas API client

#### JavaScript API (Express)
- **Framework**: Express.js
- **AWS SDK**: AWS SDK v3 for Bedrock integration
- **Canvas Client**: Custom axios-based Canvas API client
- **Lightweight**: Minimal dependencies with manual validation

Both services provide identical REST API endpoints and response formats.

## 📦 Installation

### Prerequisites
- Node.js 18+ and pnpm 10.13.1
- Python 3.11+ and uv package manager
- AWS credentials configured (for Bedrock access)
- Canvas API token and domain (for Canvas integration)

### Frontend Setup

```bash
cd frontend
pnpm install           # Install dependencies
pnpm dev              # Start dev server at http://localhost:3000
```

**Additional Frontend Commands:**
```bash
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm check            # Run Biome linting and formatting
pnpm format           # Format code with Biome
```

### Python API Setup

```bash
cd python
uv sync               # Install dependencies with uv
python main.py        # Run FastAPI server at http://localhost:8000
```

**API Documentation:** Visit `http://localhost:8000/docs` for auto-generated OpenAPI documentation.

### JavaScript API Setup

```bash
cd javascript
pnpm install          # Install dependencies
node index.js         # Run Express server at http://localhost:8000
```

## 🔧 Configuration

### Environment Variables

**AWS Bedrock (Required for AI features):**
- Configure AWS credentials via standard AWS credential chain:
  - IAM role (recommended for production)
  - `~/.aws/credentials` file
  - Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- Default region: `us-east-1`

**Canvas LMS Integration (Required for Canvas features):**
```bash
export CANVAS_API_KEY="your_canvas_api_token_here"
export CANVAS_DOMAIN="your-school.instructure.com"  # or full URL like https://your-school.instructure.com
```

### Configuration Files
- `frontend/rsbuild.config.mjs`: Build system configuration
- `frontend/biome.json`: Code quality and formatting rules
- `frontend/postcss.config.mjs`: PostCSS configuration for Tailwind
- `python/pyproject.toml`: Python dependencies and project metadata
- `javascript/package.json`: JavaScript dependencies

## 🔌 API Endpoints

Both Python and JavaScript backends expose identical REST APIs:

### AI Completions
- `POST /api/completions` - Single message AI completion
- `POST /api/chats` - Multi-message chat conversation
- `POST /api/streaming/chats` - Streaming chat responses (SSE)

### Canvas LMS
- `GET /api/canvas/search?q=query` - Smart search Canvas recipients/content
- `GET /api/canvas/courses/{course_id}/students` - Get students in course
- `GET /api/canvas/user` - Get current Canvas user
- `GET /api/canvas/courses` - Get user's courses
- `GET /api/canvas/test` - Test Canvas connectivity

### Health & Status
- `GET /api/health` - Health check with Bedrock connectivity status

## 💡 Usage Examples

### AI Completion
```bash
curl -X POST http://localhost:8000/api/completions \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Canvas LMS?", "system": "You are a helpful assistant."}'
```

### Canvas Search
```bash
curl "http://localhost:8000/api/canvas/search?q=mathematics&per_page=10"
```

### Get Course Students
```bash
curl "http://localhost:8000/api/canvas/courses/12345/students?include_avatar_url=true"
```

## 🛠️ Development

### Package Management
- **Frontend & JavaScript**: pnpm (version 10.13.1)
- **Python**: uv package manager

### Code Quality
- **Frontend**: Biome for linting and formatting
- **Consistent APIs**: Both backend services provide identical interfaces
- **Error Handling**: Comprehensive error handling for AWS and Canvas API calls
- **Graceful Degradation**: Canvas integration gracefully handles missing environment variables

## 📚 Key Dependencies

### Python
- `fastapi[standard]` - Web framework with automatic OpenAPI docs
- `boto3` - AWS SDK for Bedrock integration
- `requests` - HTTP client for Canvas API calls

### JavaScript
- `express` - Web framework
- `@aws-sdk/client-bedrock-runtime` - AWS SDK v3 for Bedrock
- `axios` - HTTP client for Canvas API calls

### Frontend
- `react` - UI framework
- `@instructure/ui` - Educational UI component library
- `page` - Client-side routing
- `@rsbuild/core` - Build system

## 📝 Notes

- No testing frameworks currently configured
- All Canvas endpoints return consistent JSON with `success` boolean
- Streaming endpoints use Server-Sent Events (SSE) format
- Project designed for educational technology workshop demonstrations
- Choose either Python or JavaScript backend based on your preference - they provide identical functionality

## 🤝 Contributing

This is a workshop sample application. Feel free to extend it with additional features, testing frameworks, or deployment configurations as needed for your educational use case.