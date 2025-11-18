# Quicksilver

> AI-powered document chat platform with RAG capabilities built on Next.js and FastAPI

Quicksilver is a modern document intelligence platform that enables users to chat with their documents using AI. Upload files, organize them into projects, and have natural conversations powered by retrieval-augmented generation (RAG) and local language models.

## Table of Contents

- [Background](#background)
- [Install](#install)
  - [Dependencies](#dependencies)
- [Usage](#usage)
- [Architecture](#architecture)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Background

Quicksilver was built to provide a privacy-focused, locally-hosted alternative to cloud-based document chat services. By leveraging Ollama for local LLM inference and vector embeddings for semantic search, users can interact with their documents without sending sensitive data to external APIs.

The platform uses a hybrid architecture combining Next.js for the frontend and API routes, with a FastAPI microservice handling document processing and vector search operations. This separation allows for optimized performance in document-heavy operations while maintaining a seamless user experience.

## Install

### Dependencies

Before installing Quicksilver, ensure you have the following prerequisites:

- **Node.js** 20+ and **Bun** runtime installed
- **Docker** and **Docker Compose** (for containerized deployment)
- **Ollama** running locally or accessible via network
- **Python** 3.11+ (if running FastAPI service separately)

Clone the repository:

```bash
git clone https://github.com/yourusername/quicksilver.git
cd quicksilver
```

Install dependencies:

```bash
bun install
```

Set up environment variables:

```bash
cp .env.docker.example .env
# Edit .env with your configuration
```

Pull the required Ollama model:

```bash
ollama pull gemma3:4b-it-qat
```

Set up the database:

```bash
bunx prisma generate
bunx prisma migrate dev
```

## Usage

### Development Mode

Start the development server with hot-reload:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

To run the FastAPI service separately:

```bash
cd ai
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Production with Docker

For a complete production deployment with all services:

```bash
docker-compose up -d
```

Access the application at `http://localhost`. See [DOCKER.md](DOCKER.md) for detailed deployment instructions.

### Basic Usage

1. **Create a Profile**: On first launch, create a user profile to get started
2. **Create a Project**: Projects organize related documents and conversations
3. **Upload Documents**: Add PDF, TXT, DOCX, or other supported files to your project
4. **Start Chatting**: Ask questions about your documents and receive AI-powered answers with source citations

## Architecture

Quicksilver consists of four main components:

- **Next.js Frontend** (React 19, TypeScript): User interface and API routes
- **FastAPI Microservice** (Python): Document processing, embeddings, and vector search
- **MongoDB**: Stores chat messages and conversation history
- **Ollama**: Local LLM inference for text generation and embeddings
- **LanceDB**: Vector database for semantic search (embedded in FastAPI service)

### Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Radix UI, Zustand
- **Backend**: FastAPI, Prisma (SQLite), MongoDB
- **AI/ML**: Ollama, LanceDB, Sentence Transformers
- **Infrastructure**: Docker, Nginx, Bun runtime

### Data Flow

```
User Upload → FastAPI → Document Processing → Text Chunks → Embeddings → LanceDB
                                                                              ↓
User Query → Next.js → FastAPI → Vector Search → Relevant Chunks → Ollama → Response
```

## API

### Next.js API Routes

The Next.js application exposes the following API endpoints:

- `POST /api/chat` - Send messages and receive AI responses
- `POST /api/upload` - Upload documents to a project
- `GET /api/projects` - List all projects for the current user
- `POST /api/projects` - Create a new project

### FastAPI Endpoints

The Python microservice provides document processing capabilities:

- `POST /api/ai/upload` - Process and embed uploaded documents
- `POST /api/ai/search` - Perform semantic search across document vectors
- `GET /api/ai/` - Health check endpoint

For detailed API documentation, run the FastAPI service and visit `http://localhost:8000/docs`.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Questions & Issues**: Open an issue on GitHub for bug reports or feature requests
2. **Pull Requests**: PRs are accepted and appreciated
   - Fork the repository and create a feature branch
   - Write clear commit messages
   - Ensure all tests pass before submitting
   - Follow the existing code style (ESLint configuration provided)
3. **Code of Conduct**: Be respectful and constructive in all interactions

Please check existing issues before opening new ones to avoid duplicates.

## License

MIT © SK

See [LICENSE](LICENSE) file for details.
