# CyberSec & IAM Blog

A modern cybersecurity and Identity & Access Management (IAM) blog built with **pure CQRS (Command Query Responsibility Segregation)** and **Event-Driven Architecture**. This application demonstrates advanced architectural patterns with no traditional CRUD operations - all writes go through Commands that emit Events, and all reads go through Queries that read from Read Models.

## 🏗️ Architecture Overview

### Core Principles
- **Pure CQRS**: Complete separation of command and query responsibilities
- **Event Sourcing**: All state changes are captured as immutable events
- **Event-Driven Architecture**: Loose coupling through domain events
- **No CRUD Operations**: All writes are commands, all reads are queries
- **Eventual Consistency**: Read models are eventually consistent with the event store

### Technology Stack

#### Backend
- **Node.js** with Express.js
- **EventStore DB** for event sourcing
- **MongoDB** for read models
- **Redis** for caching and session management
- **Socket.io** for real-time updates

#### Frontend
- **React 18** with modern hooks
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **Framer Motion** for animations
- **React Router** for navigation

#### Infrastructure
- **Docker & Docker Compose** for containerization
- **Winston** for structured logging
- **Joi** for validation
- **Helmet** for security headers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd iam_blog
```

### 2. Environment Setup
```bash
# Copy environment file
cp env.example .env

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Start Infrastructure Services
```bash
# Start EventStore, MongoDB, and Redis
docker-compose up -d eventstore mongodb redis
```

### 4. Setup Database
```bash
# Initialize databases and create sample data
npm run setup:db
```

### 5. Start the Application
```bash
# Start both backend and frontend in development mode
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **EventStore UI**: http://localhost:2113
- **MongoDB**: localhost:27017

## 📁 Project Structure

```
iam_blog/
├── src/backend/                    # Backend application
│   ├── infrastructure/             # CQRS infrastructure
│   │   ├── EventStore.js          # Event store client
│   │   ├── CommandBus.js          # Command handling
│   │   ├── QueryBus.js            # Query handling
│   │   ├── EventBus.js            # Event publishing
│   │   └── ReadModelStore.js      # Read model persistence
│   ├── domain/                    # Domain layer
│   │   ├── commands/              # Command definitions
│   │   ├── events/                # Event definitions
│   │   └── aggregates/            # Domain aggregates
│   ├── application/               # Application layer
│   │   ├── commandHandlers/       # Command handlers
│   │   └── queryHandlers/         # Query handlers
│   ├── readModels/               # Read model layer
│   │   ├── schemas/              # MongoDB schemas
│   │   └── projections/          # Event projections
│   ├── api/                      # API layer
│   │   └── routes/               # REST endpoints
│   └── utils/                    # Utilities
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── stores/              # State management
│   │   └── utils/               # Frontend utilities
│   └── public/                  # Static assets
├── scripts/                     # Setup and utility scripts
├── docker-compose.yml           # Docker services
└── README.md                   # This file
```

## 🎯 Key Features

### Content Management
- **Rich Blog Posts**: Markdown support with syntax highlighting
- **Categorization**: Security, IAM, AI & Security topics
- **Tagging System**: Flexible content organization
- **SEO Optimization**: Meta tags and structured data
- **Featured Images**: Visual content support

### CQRS Implementation
- **Command Side**: Blog post creation, updates, publishing
- **Query Side**: Optimized read models for different views
- **Event Projections**: Real-time read model updates
- **Eventual Consistency**: Robust event handling

### User Experience
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: User preference support
- **Search Functionality**: Full-text search across content
- **Performance**: Optimized loading and caching
- **Accessibility**: WCAG compliant components

### Security Focus
- **Content Security Policy**: XSS protection
- **Rate Limiting**: API protection
- **Input Validation**: Comprehensive data validation
- **Audit Logging**: Complete action tracking

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only

# Building
npm run build           # Build both backend and frontend
npm run build:backend   # Build backend only
npm run build:frontend  # Build frontend only

# Database
npm run setup:db        # Initialize databases and sample data

# Testing
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
```

### Adding New Features

#### 1. Commands and Events
```javascript
// 1. Define command in src/backend/domain/commands/
class CreateCommentCommand extends Command {
  constructor(data, metadata = {}) {
    super('CreateComment', data, metadata);
  }
}

// 2. Define event in src/backend/domain/events/
class CommentCreatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CommentCreated', data, metadata);
  }
}
```

#### 2. Command Handler
```javascript
// 3. Create handler in src/backend/application/commandHandlers/
async handleCreateComment(command) {
  // Business logic
  const event = new CommentCreatedEvent(eventData);
  await this.eventStore.appendToStream(streamName, [event]);
  await this.eventBus.publish(event);
}
```

#### 3. Read Model Projection
```javascript
// 4. Update projection in src/backend/readModels/projections/
async onCommentCreated(event) {
  await this.readModelStore.create('Comment', event.data);
}
```

#### 4. Query Handler
```javascript
// 5. Create query handler
async handleGetComments(query) {
  return await this.readModelStore.find('Comment', query.parameters);
}
```

## 🐳 Docker Deployment

### Full Stack Deployment
```bash
# Build and start all services
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Individual Services
```bash
# Start only infrastructure
docker-compose up -d eventstore mongodb redis

# Start application services
docker-compose up -d backend frontend
```

## 📊 Monitoring and Observability

### Logging
- **Structured Logging**: JSON formatted logs with Winston
- **Request Tracing**: Unique request IDs
- **Performance Metrics**: Response times and throughput
- **Error Tracking**: Comprehensive error logging

### Health Checks
- **API Health**: `/health` endpoint
- **Database Connectivity**: EventStore and MongoDB status
- **Service Dependencies**: Redis and external services

### Metrics (Future Enhancement)
- Event processing rates
- Command/query performance
- Read model lag monitoring
- User engagement analytics

## 🔒 Security Considerations

### Data Protection
- **Input Sanitization**: All user inputs validated
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **CSRF Protection**: Token-based validation

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-Based Access**: Granular permissions
- **Session Management**: Secure session handling
- **Password Security**: Bcrypt hashing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow CQRS patterns strictly
- Write comprehensive tests
- Update documentation
- Follow code style guidelines
- Add proper error handling

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **EventStore** team for excellent event sourcing database
- **MongoDB** for flexible document storage
- **React** team for the amazing frontend framework
- **Tailwind CSS** for utility-first styling
- **CQRS/ES** community for architectural guidance

## 📞 Support

For questions, issues, or contributions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ for the cybersecurity community**
