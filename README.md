# 📚 Bosta Library Management System

A comprehensive RESTful API for library management built with Node.js, Express.js, and PostgreSQL. This system provides complete functionality for managing books, borrowers, borrowings, and generating detailed analytics reports.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-316192?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.37+-52B0E7?style=flat&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **📖 Book Management**: Complete CRUD operations with search and availability tracking
- **👥 Borrower Management**: Full borrower profile management
- **📋 Borrowing System**: Track loans, due dates, returns, and overdue items
- **📊 Analytics & Reports**: Comprehensive CSV analytics with trends and statistics
- **🔒 Security**: Rate limiting, input sanitization, and secure headers
- **⚡ Performance**: Caching system for improved response times
- **📚 API Documentation**: Well-documented RESTful endpoints

## 🛠️ Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v13+)
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kareem-Khaled/Bosta-Library-Management-System.git
   cd Bosta-Library-Management-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   # Create .env file
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=library_management
   DB_USER=your_username
   DB_PASSWORD=your_password
   PORT=3000
   NODE_ENV=development
   ```

4. **Database setup**
   ```bash
   npm run init-db    # Initialize database, create tables, and add sample data
   ```

5. **Start the server**
   ```bash
   npm start          # Production
   npm run dev        # Development with auto-reload
   ```

6. **Verify setup**
   ```bash
   # Test the API
   curl http://localhost:3000/api/books
   
   # Check quick stats
   curl http://localhost:3000/api/reports/quick-stats
   ```

🎉 **Server running at** `http://localhost:3000`

## � Documentation

- **📋 Database Schema**: [`database/schema-diagram.md`](database/schema-diagram.md) - Complete ERD with constraints and indexes
- **📡 API Reference**: [`docs/API-Documentation.md`](docs/API-Documentation.md) - All 21 endpoints with examples

## �📡 API Endpoints

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/books` | Get all books |
| `GET` | `/api/books?search=title` | Search books by title, author, or ISBN |
| `GET` | `/api/books?available=true` | Get only available books |
| `GET` | `/api/books/:id` | Get book by ID |
| `POST` | `/api/books` | Create new book |
| `PUT` | `/api/books/:id` | Update book |
| `DELETE` | `/api/books/:id` | Delete book |

### Borrowers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/borrowers` | Get all borrowers |
| `GET` | `/api/borrowers/:id` | Get borrower by ID |
| `POST` | `/api/borrowers` | Create new borrower |
| `PUT` | `/api/borrowers/:id` | Update borrower |
| `DELETE` | `/api/borrowers/:id` | Delete borrower |

### Borrowings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/borrowings` | Get all borrowings |
| `GET` | `/api/borrowings?book_id=1` | Filter borrowings by book |
| `GET` | `/api/borrowings?borrower_id=5` | Filter borrowings by borrower |
| `GET` | `/api/borrowings?status=active` | Filter by status (active/returned) |
| `GET` | `/api/borrowings/:id` | Get borrowing by ID |
| `GET` | `/api/borrowings/overdue` | Get overdue borrowings |
| `POST` | `/api/borrowings` | Create new borrowing |
| `PUT` | `/api/borrowings/:id/return` | Return a book |
| `DELETE` | `/api/borrowings/:id` | Delete borrowing |

### Reports & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/borrowing-analytics` | Generate comprehensive CSV analytics |
| `GET` | `/api/reports/quick-stats` | Get quick statistics |
| `GET` | `/api/reports/download/:fileName` | Download generated reports |

## 📊 Analytics & Reports

Generate comprehensive analytics reports in CSV format including summary statistics, top books, top borrowers, monthly trends, and overdue tracking.

### Quick Example
```bash
curl -X GET "http://localhost:3000/api/reports/borrowing-analytics?startDate=2025-01-01&endDate=2025-07-31"
```

## 🏗️ Architecture

```
src/
├── database/          # Database configuration
├── middleware/        # Security, caching, error handling
├── models/           # Sequelize ORM models
├── routes/           # API endpoints
├── services/         # Business logic
└── server.js         # Application entry point
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Sanitization**: Protection against XSS and injection attacks
- **CORS**: Configured cross-origin resource sharing
- **Helmet**: Security headers middleware
- **Error Handling**: Secure error responses without sensitive data exposure

## 🧪 Development

### Available Scripts
```bash
npm start             # Start production server
npm run dev           # Development with auto-reload
npm run init-db       # Initialize database with sample data
npm test              # Run tests
```

---

⭐ **If you found this project helpful, please give it a star!** ⭐