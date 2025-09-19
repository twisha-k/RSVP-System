# RSVP Event Management System - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Data Models](#data-models)
6. [Testing](#testing)

## Overview

The RSVP Event Management System provides a complete RESTful API for managing events, user registrations, comments, and administrative functions. Built with Express.js, MongoDB, and JWT authentication.

**Base URL:** `http://localhost:5000/api`

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Public Endpoints (No Authentication Required)
- `GET /api/events` - View public events
- `GET /api/events/:id` - View specific event details
- `GET /api/comments/events/:eventId` - View event comments
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request

### Protected Endpoints
All other endpoints require authentication with a valid JWT token.

### Admin Endpoints
Admin endpoints require authentication with an admin-level JWT token.

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "location": "New York, NY",
  "bio": "Event enthusiast",
  "interests": ["technology", "networking"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

#### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

#### POST /api/auth/reset-password
Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newpassword123"
}
```

### Event Endpoints

#### GET /api/events
Get list of events with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by event category
- `city` (string): Filter by city
- `search` (string): Search in title and description
- `startDate` (date): Filter events starting after this date
- `tags` (string): Comma-separated list of tags

**Response:**
```json
{
  "success": true,
  "events": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalEvents": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /api/events/:id
Get specific event details.

#### POST /api/events
Create a new event (requires authentication).

**Request Body:**
```json
{
  "title": "Tech Meetup 2024",
  "description": "A great networking event for tech enthusiasts",
  "startDate": "2024-12-25T18:00:00.000Z",
  "endDate": "2024-12-25T22:00:00.000Z",
  "location": {
    "venue": "Tech Hub",
    "address": "123 Tech Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105",
    "country": "USA"
  },
  "maxAttendees": 100,
  "category": "technology",
  "tags": ["networking", "tech", "startup"],
  "isPublic": true,
  "registrationDeadline": "2024-12-24T23:59:59.000Z"
}
```

#### PUT /api/events/:id
Update an event (requires authentication, must be organizer).

#### DELETE /api/events/:id
Delete an event (requires authentication, must be organizer).

#### GET /api/events/my/created
Get events created by the current user.

### RSVP Endpoints

#### POST /api/rsvps/events/:eventId
RSVP to an event.

**Request Body:**
```json
{
  "status": "attending",
  "notes": "Looking forward to this event!"
}
```

**Status options:** `attending`, `maybe`, `not_attending`

#### GET /api/rsvps/my
Get current user's RSVPs.

**Query Parameters:**
- `status` (string): Filter by RSVP status
- `page` (number): Page number
- `limit` (number): Items per page

#### GET /api/rsvps/events/:eventId
Get user's RSVP status for a specific event.

#### GET /api/rsvps/events/:eventId/all
Get all RSVPs for an event (organizers only).

#### DELETE /api/rsvps/events/:eventId
Cancel RSVP for an event.

### Comment Endpoints

#### GET /api/comments/events/:eventId
Get comments for an event.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page

#### POST /api/comments/events/:eventId
Add a comment to an event.

**Request Body:**
```json
{
  "content": "This looks like a great event!",
  "parentComment": "optional-parent-comment-id"
}
```

#### PUT /api/comments/:commentId
Update a comment (author only).

#### DELETE /api/comments/:commentId
Delete a comment (author or event organizer).

#### POST /api/comments/:commentId/like
Like/unlike a comment.

#### GET /api/comments/my
Get current user's comments.

### User Endpoints

#### GET /api/users/me
Get current user's profile.

#### PUT /api/users/profile
Update user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "bio": "Updated bio",
  "location": "San Francisco, CA",
  "interests": ["technology", "networking", "startups"]
}
```

#### PUT /api/users/password
Change user password.

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

#### PUT /api/users/email
Update user email.

#### DELETE /api/users/account
Delete user account (requires password confirmation).

#### GET /api/users/dashboard
Get user dashboard data.

#### GET /api/users/search
Search for users.

**Query Parameters:**
- `query` (string): Search query
- `page` (number): Page number
- `limit` (number): Items per page

#### GET /api/users/:id
Get public user profile.

### Admin Endpoints

#### POST /api/admin/api/login
Admin login.

#### GET /api/admin/api/dashboard/stats
Get admin dashboard statistics.

#### GET /api/admin/api/dashboard/activity
Get recent platform activity.

#### GET /api/admin/api/users
Get all users (admin only).

#### GET /api/admin/api/events
Get all events (admin only).

#### DELETE /api/admin/api/users/:userId
Delete a user (admin only).

#### DELETE /api/admin/api/events/:eventId
Delete an event (admin only).

#### PATCH /api/admin/api/users/:userId/status
Toggle user active status (admin only).

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development mode only)"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Data Models

### User
```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "bio": "string",
  "location": "string",
  "interests": ["string"],
  "avatar": "string",
  "isActive": "boolean",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Event
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "startDate": "date",
  "endDate": "date",
  "location": {
    "venue": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "organizer": "User",
  "maxAttendees": "number",
  "category": "string",
  "tags": ["string"],
  "isPublic": "boolean",
  "registrationDeadline": "date",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### RSVP
```json
{
  "id": "string",
  "user": "User",
  "event": "Event",
  "status": "attending|maybe|not_attending",
  "notes": "string",
  "responseDate": "date"
}
```

### Comment
```json
{
  "id": "string",
  "content": "string",
  "author": "User",
  "event": "Event",
  "parentComment": "Comment",
  "likes": ["User"],
  "isEdited": "boolean",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Testing

### Using Postman
1. Import the provided Postman collection: `RSVP_System_API.postman_collection.json`
2. Set the `baseUrl` variable to `http://localhost:5000`
3. Start with user registration to get an authentication token
4. The collection will automatically set the auth token after successful login

### Manual Testing with cURL

#### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

#### Get events:
```bash
curl -X GET http://localhost:5000/api/events
```

#### Create an event (requires token):
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Event",
    "description": "A test event",
    "startDate": "2024-12-25T18:00:00.000Z",
    "endDate": "2024-12-25T22:00:00.000Z",
    "location": {
      "venue": "Test Venue",
      "city": "Test City"
    }
  }'
```

### Environment Setup for Testing

1. Ensure MongoDB is running
2. Start the backend server: `npm start`
3. The server runs on `http://localhost:5000`
4. All API endpoints are prefixed with `/api`

### Rate Limiting
The API implements rate limiting:
- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

### CORS
CORS is enabled for development. In production, configure allowed origins appropriately.

## Notes

- All dates should be in ISO 8601 format
- File uploads (avatars, event images) are not yet implemented
- Email functionality requires proper SMTP configuration
- In development mode, detailed error messages are returned
- Password reset tokens expire after 1 hour
- JWT tokens expire after 7 days