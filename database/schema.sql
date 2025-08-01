-- Library Management System Database Schema

-- Create database (run this separately if needed)
-- CREATE DATABASE library_management;

-- Use the database
-- \c library_management;

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(13) UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    available_quantity INTEGER NOT NULL DEFAULT 1,
    shelf_location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_available_quantity_non_negative CHECK (available_quantity >= 0),
    CONSTRAINT check_available_quantity_le_quantity CHECK (available_quantity <= quantity)
);

-- Borrowers table
CREATE TABLE IF NOT EXISTS borrowers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    registered_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borrowings table
CREATE TABLE IF NOT EXISTS borrowings (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_due_date_after_borrow CHECK (due_date > borrow_date),
    CONSTRAINT check_return_date_after_borrow CHECK (return_date IS NULL OR return_date >= borrow_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_borrowers_email ON borrowers(email);
CREATE INDEX IF NOT EXISTS idx_borrowings_borrower_id ON borrowings(borrower_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_book_id ON borrowings(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_return_date ON borrowings(return_date);
CREATE INDEX IF NOT EXISTS idx_borrowings_due_date ON borrowings(due_date);

-- Insert sample data for testing
INSERT INTO books (title, author, isbn, quantity, available_quantity, shelf_location) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 5, 5, 'A-101'),
('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 3, 2, 'A-102'),
('1984', 'George Orwell', '9780451524935', 4, 4, 'B-201'),
('Pride and Prejudice', 'Jane Austen', '9780141439518', 2, 1, 'B-202'),
('The Catcher in the Rye', 'J.D. Salinger', '9780316769174', 6, 6, 'C-301')
ON CONFLICT (isbn) DO NOTHING;

INSERT INTO borrowers (name, email, phone) VALUES
('John Doe', 'john.doe@example.com', '+1234567890'),
('Jane Smith', 'jane.smith@example.com', '+1987654321'),
('Bob Johnson', 'bob.johnson@example.com', '+1122334455'),
('Alice Brown', 'alice.brown@example.com', '+1555666777'),
('Charlie Wilson', 'charlie.wilson@example.com', '+1999888777')
ON CONFLICT (email) DO NOTHING;