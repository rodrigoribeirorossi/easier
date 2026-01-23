# easier API Server

RESTful API server for the easier personal finance application.

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- SQLite database

### Installation

```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Seed database with sample data (optional)
npm run db:seed

# Start the server
npm run server
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Transactions

- `GET /api/transactions` - Get all transactions
  - Query params: `userId`, `accountId`, `categoryId`, `type`, `startDate`, `endDate`, `sortBy`, `order`
  - Example: `GET /api/transactions?type=income&sortBy=date&order=desc`
  
- `GET /api/transactions/:id` - Get a specific transaction

- `POST /api/transactions` - Create a new transaction
  ```json
  {
    "type": "income",
    "amount": 5000,
    "description": "Monthly salary",
    "date": "2024-01-15T00:00:00.000Z",
    "isRecurring": false,
    "tags": ["salary", "work"],
    "accountId": "account-uuid",
    "categoryId": "category-uuid",
    "userId": "user-uuid"
  }
  ```

- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction

### Accounts

- `GET /api/accounts` - Get all accounts
  - Query params: `userId`, `type`
  
- `GET /api/accounts/:id` - Get a specific account

- `POST /api/accounts` - Create a new account
  ```json
  {
    "name": "Main Checking",
    "type": "checking",
    "balance": 10000,
    "currency": "BRL",
    "color": "#3b82f6",
    "icon": "wallet",
    "userId": "user-uuid"
  }
  ```

- `PUT /api/accounts/:id` - Update an account
- `DELETE /api/accounts/:id` - Delete an account

### Payments

- `GET /api/payments` - Get all payments
  - Query params: `userId`, `status`, `categoryId`, `startDate`, `endDate`, `sortBy`, `order`
  
- `GET /api/payments/:id` - Get a specific payment

- `POST /api/payments` - Create a new payment
  ```json
  {
    "name": "Rent",
    "amount": 1500,
    "dueDate": "2024-02-01T00:00:00.000Z",
    "isRecurring": true,
    "frequency": "monthly",
    "status": "pending",
    "categoryId": "category-uuid",
    "accountId": "account-uuid",
    "userId": "user-uuid"
  }
  ```

- `PUT /api/payments/:id` - Update a payment
- `DELETE /api/payments/:id` - Delete a payment

### Investments

- `GET /api/investments` - Get all investments
  - Query params: `userId`, `type`, `sortBy`, `order`
  
- `GET /api/investments/:id` - Get a specific investment

- `POST /api/investments` - Create a new investment
  ```json
  {
    "name": "Fixed Income Fund",
    "type": "fixed_income",
    "initialAmount": 10000,
    "currentAmount": 10500,
    "annualRate": 12.5,
    "startDate": "2024-01-01T00:00:00.000Z",
    "maturityDate": "2025-01-01T00:00:00.000Z",
    "userId": "user-uuid"
  }
  ```

- `PUT /api/investments/:id` - Update an investment
- `DELETE /api/investments/:id` - Delete an investment

### Categories

- `GET /api/categories` - Get all categories
  - Query params: `type`
  - Example: `GET /api/categories?type=expense`
  
- `GET /api/categories/:id` - Get a specific category

- `POST /api/categories` - Create a new category
  ```json
  {
    "name": "Food",
    "icon": "utensils",
    "color": "#ef4444",
    "type": "expense"
  }
  ```

- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category (only if no transactions/payments)

### Users

- `GET /api/users/me` - Get current user
  - Query param: `userId` (required)
  
- `GET /api/users` - Get all users

- `GET /api/users/:id` - Get a specific user

- `POST /api/users` - Create a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "role": "member"
  }
  ```

- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

## Features

- **CORS enabled** - Cross-origin requests allowed
- **RESTful design** - Standard HTTP methods and status codes
- **Prisma ORM** - Type-safe database queries
- **Query filtering** - Support for filtering, sorting, and date ranges
- **Error handling** - Comprehensive error responses
- **Transaction safety** - Database transactions for balance updates
- **Related data** - Automatic inclusion of related entities

## Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Development

The API uses:
- Express.js for the server framework
- Prisma for database ORM
- TypeScript for type safety
- SQLite for the database

### Database Schema

See `prisma/schema.prisma` for the complete database schema including:
- Users
- Accounts
- Categories
- Transactions
- Payments
- Investments

## Environment Variables

- `PORT` - Server port (default: 3001)

## Notes

- All dates should be in ISO 8601 format
- Amount values are stored as Float
- Tags in transactions are stored as JSON strings
- Account balances are automatically updated when transactions are created/updated/deleted
- Cascade deletes are configured for user-owned resources
