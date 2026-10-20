# 📚 LibraTrack — Smart Library Management System

Functional Web application Hub for Library Operations. Simplifying book indexing and circulation, providing a user Friendly GUI that allows for easy look up and a Administrator Log for system data management.

A full-stack web application for managing library cataloging, searching, and circulation through dedicated user and administrator interfaces.

LibraTrack streamlines how libraries store, retrieve, and manage book records while providing an intuitive browsing experience for users and secure operational tools for administrators.

---

## 🎯 Project Purpose
Traditional library management processes are often manual, fragmented, or difficult to scale.  
LibraTrack provides a centralized digital platform that enables:

- Efficient book discovery
- Organized inventory tracking
- Secure circulation management
- Real-time borrower monitoring

---

## 👥 System Roles

| Role | Capabilities |
|----|----|
| **User** | Search and explore books |
| **Administrator** | Manage catalog and circulation |

---

## ✨ Features

### User Interface
- Search books by keyword
- Filter by genre or text length
- View book cover and metadata
- See author, publication date, and synopsis

### Administrator Interface
- Secure login authentication
- Add and update book records
- Check-in / Check-out books
- Track borrowers (name, address, phone)
- Monitor due dates

---

## 🧠 System Architecture
React Frontend
↓
Node.js + Express API
↓
MongoDB Database
↓
Open Libary API


The system follows a client-server architecture where the frontend interacts with a REST API that manages database operations and external data retrieval.

---

## 🛠 Technology Stack

### Frontend
- React.js
- CSS / UI Components

### Backend
- Node.js
- Express.js
- RESTful API Design

### Database
- MongoDB (NoSQL document storage)

### External Services
- Integrated Open Library API to automatically retrieve book information and cover images.

### Development Tools
- GitHub (version control)
- Postman (API testing)
- VS Code (development environment)

---

## 📦 Data Model Overview

### Book
- Title
- Author
- Genre
- Page Count
- Cover Image
- Synopsis
- Availability Status

### Borrower
- Name
- Address
- Phone Number
- Borrowed Book
- Due Date


### API Features
- User registration
- User authentication
- Book management
- Borrowing operations
- Return processing
- Inventory lookup

### Testing
- Playwright end-to-end testing
- Authentication workflow tests
- API endpoint validation
- Cross-browser testing (Chromium, Firefox, WebKit)

### Skills Demonstrated

- Full-stack web development
- JWT authentication
- REST API development
- MongoDB database integration
- Automated testing with Playwright
- Cross-browser testing
- Git version control

### Screenshots
screenshots/Login.png
screenshots/Dashboard.png
screenshots/Search.png
screenshots/Bookcard.png