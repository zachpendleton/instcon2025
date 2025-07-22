# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Canvas LMS AI Workshop sample application with three distinct components:
- **Frontend**: React web app using Instructure UI components and Rsbuild
- **Python API**: FastAPI service with AWS Bedrock and Canvas LMS integration
- **JavaScript API**: Express.js service with AWS Bedrock and Canvas LMS integration

Both backend services provide identical APIs for AI completions, chat conversations, and Canvas LMS data access.

## Development Commands

### Frontend (React + Rsbuild)
```bash
cd frontend
pnpm install           # Install dependencies
pnpm dev              # Start dev server at http://localhost:3000
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm check            # Run Biome linting and formatting
pnpm format           # Format code with Biome
```

### Python API (FastAPI)
```bash
cd python
uv sync               # Install dependencies with uv
python main.py        # Run FastAPI server at http://localhost:8000
```

**API Endpoints:**
- `POST /api/completions` - Single message AI completion
- `POST /api/chats` - Multi-message chat conversation
- `POST /api/streaming/chats` - Streaming chat responses
- `GET /api/health` - Health check with Bedrock connectivity
- `GET /api/canvas/search?q=query` - Canvas smart search
- `GET /api/canvas/courses/{course_id}/students` - Get students in course
- `GET /api/canvas/user` - Get current Canvas user
- `GET /api/canvas/courses` - Get user's courses
- `GET /api/canvas/test` - Test Canvas connectivity
- Auto-generated API docs at: `http://localhost:8000/docs`

### JavaScript API (Express)
```bash
cd javascript
pnpm install          # Install dependencies
node index.js         # Run Express server at http://localhost:8000
```

**API Endpoints:** (identical to Python API)
- `POST /api/completions` - Single message AI completion
- `POST /api/chats` - Multi-message chat conversation
- `POST /api/streaming/chats` - Streaming chat responses
- `GET /api/health` - Health check with Bedrock connectivity
- `GET /api/canvas/search?q=query` - Canvas smart search
- `GET /api/canvas/courses/{course_id}/students` - Get students in course
- `GET /api/canvas/user` - Get current Canvas user
- `GET /api/canvas/test` - Test Canvas connectivity

## Architecture

### Frontend Structure
- Uses **Rsbuild** as build system (modern webpack alternative)
- **React 19** with modern JSX syntax
- **Instructure UI** component library for educational applications
- **Page.js** for client-side routing
- **Tailwind CSS 4** with PostCSS for styling
- **Biome** for code formatting and linting

### Backend Services Architecture

**AI Integration:**
- **AWS Bedrock Runtime**: Uses `converse` and `converse_stream` APIs
- **Default Model**: Amazon Nova Pro (`us.amazon.nova-pro-v1:0`)
- **Streaming Support**: Real-time AI responses via Server-Sent Events
- **Error Handling**: Comprehensive error handling for AWS API calls

**Canvas LMS Integration:**
- **Python**: `canvas_client.py` using `requests` library
- **JavaScript**: `canvas-client.js` using `axios` library  
- **Smart Search**: Canvas recipients/content search API
- **Student Data**: Course enrollment and user profile access
- **Authentication**: Bearer token authentication with Canvas API

**Service Comparison:**
- **Python/FastAPI**: Type-safe with Pydantic models, auto-generated OpenAPI docs
- **JavaScript/Express**: Lightweight, similar functionality with manual validation
- Both services provide identical REST API interfaces and response formats

## Environment Variables

**Required for AWS Bedrock:**
- AWS credentials via standard AWS credential chain (IAM role, `~/.aws/credentials`, etc.)
- Services use `us-east-1` region by default

**Required for Canvas LMS integration:**
```bash
export CANVAS_API_KEY="your_canvas_api_token_here"
export CANVAS_DOMAIN="your-school.instructure.com"  # or full URL
```

## Key Configuration Files
- `frontend/rsbuild.config.mjs`: Build system configuration
- `frontend/biome.json`: Code quality and formatting rules
- `python/pyproject.toml`: Python dependencies and project metadata
- `python/canvas_client.py`: Canvas LMS API client class
- `javascript/canvas-client.js`: Canvas LMS API client class
- `frontend/postcss.config.mjs`: PostCSS configuration for Tailwind

## Package Management
- **Frontend & JavaScript**: pnpm (specified version 10.13.1)
- **Python**: uv package manager

## Dependencies

**Python (`python/pyproject.toml`):**
- `fastapi[standard]` - Web framework with automatic OpenAPI docs
- `boto3` - AWS SDK for Bedrock integration
- `requests` - HTTP client for Canvas API calls

**JavaScript (`javascript/package.json`):**
- `express` - Web framework
- `@aws-sdk/client-bedrock-runtime` - AWS SDK v3 for Bedrock
- `axios` - HTTP client for Canvas API calls
- `body-parser` - JSON request parsing middleware

## API Usage Examples

**AI Completion:**
```bash
curl -X POST http://localhost:8000/api/completions \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Canvas LMS?", "system": "You are a helpful assistant."}'
```

**Canvas Search:**
```bash
curl "http://localhost:8000/api/canvas/search?q=mathematics&per_page=10"
```

**Get Students in Course:**
```bash
curl "http://localhost:8000/api/canvas/courses/12345/students?include_avatar_url=true"
```

## Notes
- Both backend services provide identical APIs but use different frameworks
- Canvas integration gracefully degrades if environment variables not set
- All Canvas endpoints return consistent JSON with `success` boolean and error handling
- Streaming endpoints use Server-Sent Events (SSE) format
- No testing frameworks currently configured
- Project designed for educational technology workshop demonstrations