# DevPulse API

A collaborative backend platform for software teams to report bugs, suggest features, and manage issue workflows.

---

## Live URL

- **Live Deployment:** https://dev-pulse-ten-chi.vercel.app/

---
## Features

- **User Authentication:** Secure signup and login functionality using `jsonwebtoken` (JWT) and `bcrypt` for password hashing.
- **Issue Management:** Complete CRUD (Create, Read, Update, Delete) operations for issues.
- **Protected Routes:** Endpoints for creating, updating, and deleting issues are secured via authentication middleware.

---

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL 
- jsonwebtoken,
- bcrypt

---
## Setup Steps

### 1. Clone the Repository and Install Install Dependencies

```bash

git clone: https://github.com/SiddiqurRahmanBD/DevPulse.git

npm install

```
### 2. Configure Environment Variables

Create `.env` file in root folder then add following tasks

```env

PORT=5000
CONNECTIONSTRING="Use Postgesql Connection string "
JWT_SECRET="Use Strong JTW Secret token"
TOKEN_EXPIRE_IN=1d

```
### 3. Running App

* **For Development**
```bash

npm run dev

```
* **For Production Build**
```bash

npm run build

```
---
## API Endpoint List

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Authenticate a user and receive a JWT

### Issues (`/api/issues`)
- `GET /api/issues` - Retrieve all issues
- `GET /api/issues/:id` - Retrieve a single issue by its ID
- `POST /api/issues` - Create a new issue (Requires Auth)
- `PATCH /api/issues/:id` - Update an existing issue (Requires Auth)
- `DELETE /api/issues/:id` - Delete an issue (Requires Auth)

## Database Schema Summary

### 1. users Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | User full name |
| email | VARCHAR(255) | Unique user email |
| password | TEXT | Hashed password |
| role | VARCHAR(20) | User role (default: contributor) |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |

### 2. issues Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | VARCHAR(150) | Issue title |
| description | TEXT | Issue description |
| type | VARCHAR(50) | Issue type (bug/feature_request) |
| status | VARCHAR(50) | Issue status (default: open) |
| reporter_id | INTEGER | ID of issue reporter |
| created_at | TIMESTAMP | Issue creation time |
| updated_at | TIMESTAMP | Last update time |