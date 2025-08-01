# Library Management System - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
No authentication required for this demo version.

## Response Format
All responses follow this standard format:
```json
{
  "success": true|false,
  "message": "Description of the operation",
  "data": {}, // Response data (when success: true)
  "error": {  // Error details (when success: false)
    "message": "Error description",
    "status": 400
  }
}
```

---

# 📚 Books API

## GET /books
Get all books with optional filtering

### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search by title, author, or ISBN | `?search=gatsby` |
| `available` | boolean | Filter by availability | `?available=true` |

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "quantity": 5,
      "available_quantity": 4,
      "shelf_location": "A-101",
      "created_at": "2025-08-01T10:00:00.000Z",
      "updated_at": "2025-08-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

## GET /books/:id
Get a specific book by ID

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Book ID |

### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "quantity": 5,
    "available_quantity": 4,
    "shelf_location": "A-101",
    "created_at": "2025-08-01T10:00:00.000Z",
    "updated_at": "2025-08-01T10:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Book not found",
    "status": 404
  }
}
```

## POST /books
Create a new book

### Request Body
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "quantity": 5,
  "available_quantity": 5,  // Optional, defaults to quantity
  "shelf_location": "A-101"  // Optional
}
```

### Validation Rules
- `title`: Required, 1-255 characters
- `author`: Required, 1-255 characters  
- `isbn`: Required, 10 or 13 digits, unique
- `quantity`: Required, integer ≥ 1
- `available_quantity`: Optional, integer ≥ 0, must be ≤ quantity
- `shelf_location`: Optional, max 100 characters

### Response
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "quantity": 5,
    "available_quantity": 5,
    "shelf_location": "A-101",
    "created_at": "2025-08-01T10:00:00.000Z",
    "updated_at": "2025-08-01T10:00:00.000Z"
  }
}
```

## PUT /books/:id
Update an existing book

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Book ID |

### Request Body (all fields optional)
```json
{
  "title": "Updated Title",
  "author": "Updated Author",
  "isbn": "9780743273566",
  "quantity": 10,
  "available_quantity": 8,
  "shelf_location": "B-202"
}
```

### Business Logic
- If only `quantity` is updated, `available_quantity` is adjusted proportionally
- If both are provided, both values are respected
- `available_quantity` cannot exceed `quantity`

### Response
```json
{
  "success": true,
  "message": "Book updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Title",
    "author": "Updated Author",
    "isbn": "9780743273566",
    "quantity": 10,
    "available_quantity": 8,
    "shelf_location": "B-202",
    "created_at": "2025-08-01T10:00:00.000Z",
    "updated_at": "2025-08-01T11:00:00.000Z"
  }
}
```

## DELETE /books/:id
Delete a book

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Book ID |

### Response
```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Cannot delete book with active borrowings",
    "status": 409
  }
}
```

---

# 👥 Borrowers API

## GET /borrowers
Get all borrowers

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "registered_date": "2025-08-01",
      "created_at": "2025-08-01T10:00:00.000Z",
      "updated_at": "2025-08-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

## GET /borrowers/:id
Get a specific borrower by ID

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Borrower ID |

### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "registered_date": "2025-08-01",
    "created_at": "2025-08-01T10:00:00.000Z",
    "updated_at": "2025-08-01T10:00:00.000Z"
  }
}
```

## POST /borrowers
Create a new borrower

### Request Body
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",  // Optional
  "registered_date": "2025-08-01"  // Optional, defaults to current date
}
```

### Validation Rules
- `name`: Required, 1-255 characters
- `email`: Required, valid email format, unique
- `phone`: Optional, international format (+country code)
- `registered_date`: Optional, valid date

### Response
```json
{
  "success": true,
  "message": "Borrower created successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "registered_date": "2025-08-01",
    "created_at": "2025-08-01T10:00:00.000Z",
    "updated_at": "2025-08-01T10:00:00.000Z"
  }
}
```

## PUT /borrowers/:id
Update an existing borrower

### Request Body (all fields optional)
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "+1987654321"
}
```

### Response
```json
{
  "success": true,
  "message": "Borrower updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Name",
    "email": "updated@example.com",
    "phone": "+1987654321",
    "registered_date": "2025-08-01",
    "created_at": "2025-08-01T10:00:00.000Z",
    "updated_at": "2025-08-01T11:00:00.000Z"
  }
}
```

## DELETE /borrowers/:id
Delete a borrower

### Response
```json
{
  "success": true,
  "message": "Borrower deleted successfully"
}
```

---

# 📋 Borrowings API

## GET /borrowings
Get all borrowings with optional filtering

### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `book_id` | integer | Filter by book ID | `?book_id=1` |
| `borrower_id` | integer | Filter by borrower ID | `?borrower_id=5` |
| `status` | string | Filter by status (`active`/`returned`) | `?status=active` |

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "book_id": 1,
      "borrower_id": 1,
      "borrow_date": "2025-08-01",
      "due_date": "2025-08-15",
      "return_date": null,
      "created_at": "2025-08-01T10:00:00.000Z",
      "updated_at": "2025-08-01T10:00:00.000Z",
      "book": {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565"
      },
      "borrower": {
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    }
  ],
  "count": 1
}
```

## GET /borrowings/:id
Get a specific borrowing by ID

### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "book_id": 1,
    "borrower_id": 1,
    "borrow_date": "2025-08-01",
    "due_date": "2025-08-15",
    "return_date": null,
    "created_at": "2025-08-01T10:00:00.000Z",
    "updated_at": "2025-08-01T10:00:00.000Z",
    "book": {
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565"
    },
    "borrower": {
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

## GET /borrowings/overdue
Get all overdue borrowings

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "book_id": 1,
      "borrower_id": 1,
      "borrow_date": "2025-07-01",
      "due_date": "2025-07-15",
      "return_date": null,
      "days_overdue": 17,
      "created_at": "2025-07-01T10:00:00.000Z",
      "updated_at": "2025-07-01T10:00:00.000Z",
      "book": {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565"
      },
      "borrower": {
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    }
  ],
  "count": 1
}
```

## POST /borrowings
Create a new borrowing (borrow a book)

### Request Body
```json
{
  "book_id": 1,
  "borrower_id": 1,
  "due_date": "2025-08-15",
  "borrow_date": "2025-08-01"  // Optional, defaults to current date
}
```

### Validation Rules
- `book_id`: Required, must exist and have available copies
- `borrower_id`: Required, must exist
- `due_date`: Required, must be after borrow_date
- `borrow_date`: Optional, defaults to current date

### Response
```json
{
  "success": true,
  "message": "Book borrowed successfully",
  "data": {
    "id": 1,
    "book_id": 1,
    "borrower_id": 1,
    "borrow_date": "2025-08-01",
    "due_date": "2025-08-15",
    "return_date": null,
    "created_at": "2025-08-01T10:00:00.000Z",
    "updated_at": "2025-08-01T10:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Book is not available for borrowing",
    "status": 409
  }
}
```

## PUT /borrowings/:id/return
Return a borrowed book

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Borrowing ID |

### Request Body (optional)
```json
{
  "return_date": "2025-08-10"  // Optional, defaults to current date
}
```

### Response
```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "id": 1,
    "book_id": 1,
    "borrower_id": 1,
    "borrow_date": "2025-08-01",
    "due_date": "2025-08-15",
    "return_date": "2025-08-10",
    "created_at": "2025-08-01T10:00:00.000Z",
    "updated_at": "2025-08-10T14:00:00.000Z"
  }
}
```

## DELETE /borrowings/:id
Delete a borrowing record

### Response
```json
{
  "success": true,
  "message": "Borrowing record deleted successfully"
}
```

---

# 📊 Reports & Analytics API

## GET /reports/borrowing-analytics
Generate comprehensive borrowing analytics report in CSV format

### Query Parameters
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `startDate` | string (YYYY-MM-DD) | Start date for analysis | Yes |
| `endDate` | string (YYYY-MM-DD) | End date for analysis | Yes |

### Response
```json
{
  "success": true,
  "message": "Borrowing analytics CSV report generated successfully",
  "fileName": "borrowing-analytics-2025-01-01-to-2025-07-31-2025-08-01.csv",
  "downloadUrl": "/api/reports/download/borrowing-analytics-2025-01-01-to-2025-07-31-2025-08-01.csv",
  "analytics": {
    "period": {
      "start": "2025-01-01",
      "end": "2025-07-31"
    },
    "totalBorrowings": 150,
    "activeBorrowings": 25,
    "returnedBorrowings": 125,
    "overdueBorrowings": 8,
    "uniqueBooks": 45,
    "uniqueBorrowers": 30,
    "averageLoanDuration": 12.5,
    "topBook": "The Great Gatsby",
    "topBorrower": "John Doe"
  }
}
```

## GET /reports/quick-stats
Get quick statistics summary

### Response
```json
{
  "success": true,
  "data": {
    "totalBooks": 150,
    "availableBooks": 120,
    "totalBorrowers": 85,
    "activeBorrowings": 30,
    "overdueBorrowings": 5,
    "totalBorrowings": 450,
    "booksUtilizationRate": "80%",
    "topBookThisMonth": {
      "title": "The Great Gatsby",
      "borrowCount": 8
    },
    "topBorrowerThisMonth": {
      "name": "John Doe",
      "borrowCount": 5
    }
  }
}
```

## GET /reports/download/:fileName
Download a generated report file

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `fileName` | string | Name of the file to download |

### Response
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="report.csv"`
- File content as CSV

---

# Error Handling

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Validation error: Title is required",
    "status": 400
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Resource not found",
    "status": 404
  }
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": {
    "message": "Book with this ISBN already exists",
    "status": 409
  }
}
```

### 429 Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later.",
    "status": 429
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "status": 500
  }
}
```

---

# Rate Limiting

- **General endpoints**: 100 requests per 15 minutes per IP
- **Borrowing creation**: 3 requests per 5 minutes per IP
- **Report generation**: 10 requests per 15 minutes per IP

---

# Example Usage with cURL

## Create a Book
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "quantity": 5,
    "shelf_location": "A-101"
  }'
```

## Search Books
```bash
curl -X GET "http://localhost:3000/api/books?search=gatsby&available=true"
```

## Borrow a Book
```bash
curl -X POST http://localhost:3000/api/borrowings \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": 1,
    "borrower_id": 1,
    "due_date": "2025-08-15"
  }'
```

## Generate Analytics Report
```bash
curl -X GET "http://localhost:3000/api/reports/borrowing-analytics?startDate=2025-01-01&endDate=2025-07-31"
```
