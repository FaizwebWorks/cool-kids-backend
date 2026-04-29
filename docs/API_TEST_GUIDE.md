# The Cool Kids Backend API Test Guide

Base URL:

```txt
http://localhost:3000/api/v1
```

Start server:

```bash
npm start
```

Postman files:

```txt
postman/the-cool-kids-backend.postman_collection.json
postman/the-cool-kids-backend.postman_environment.json
```

Import both files into Postman and select the `The Cool Kids Backend - Local` environment.

## APIs

### Health

```txt
GET /health
```

Expected:

```json
{
  "success": true,
  "message": "The Cool Kids API is running"
}
```

### Auth

First user registration bootstraps the first admin account. After one user exists, only an authenticated admin can create more users.

```txt
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/me
PATCH /auth/change-password
```

Register body:

```json
{
  "name": "Admin User",
  "email": "admin@thecoolkids.test",
  "phone": "9876543210",
  "password": "Admin@12345",
  "role": "admin"
}
```

Login body:

```json
{
  "email": "admin@thecoolkids.test",
  "password": "Admin@12345"
}
```

Use returned token:

```txt
Authorization: Bearer <accessToken>
```

Refresh body:

```json
{
  "refreshToken": "<refreshToken>"
}
```

Change password body:

```json
{
  "currentPassword": "Admin@12345",
  "newPassword": "Admin@123456"
}
```

### Bookings

Public booking creation does not require login.

```txt
GET /bookings/availability?date=2026-05-01&serviceSlug=newborn&package=Starter%20Package
POST /bookings
GET /bookings/public/:id?clientEmail=aarav@example.com
```

Availability response includes free/busy slots. Backend resolves service/package duration from MongoDB, checks MongoDB bookings first, and also checks Google Calendar when Google Calendar env is configured.

```json
{
  "success": true,
  "message": "Available slots fetched successfully",
  "data": {
    "date": "2026-05-01",
    "timezone": "Asia/Kolkata",
    "durationMinutes": 60,
    "slots": [
      {
        "time": "09:00 AM",
        "start": "2026-05-01T03:30:00.000Z",
        "end": "2026-05-01T04:30:00.000Z",
        "available": true,
        "blockedBy": null
      }
    ],
    "calendarConnected": false
  }
}
```

Body:

```json
{
  "clientName": "Aarav Shah",
  "clientEmail": "aarav@example.com",
  "clientPhone": "9876543210",
  "service": "Newborn",
  "serviceSlug": "newborn",
  "package": "Starter Package",
  "preferredDate": "2026-05-01",
  "preferredTime": "09:00 AM",
  "location": "Navsari, Gujarat",
  "message": "We want a newborn photoshoot."
}
```

Admin/staff booking APIs require Bearer token:

```txt
GET /bookings?page=1&limit=10
GET /bookings?status=pending&page=1&limit=10
GET /bookings?service=Newborn&page=1&limit=10
GET /bookings?serviceSlug=newborn&page=1&limit=10
GET /bookings/:id
PATCH /bookings/:id
PATCH /bookings/:id/status
DELETE /bookings/:id
```

Public booking detail lookup does not require login, but it requires the booking id plus matching `clientEmail` or `clientPhone`.

Update booking body:

```json
{
  "preferredTime": "11:30 AM",
  "adminNotes": "Client prefers morning slot."
}
```

Update status body:

```json
{
  "status": "confirmed",
  "adminNotes": "Confirmed over phone."
}
```

Allowed booking statuses:

```txt
pending
confirmed
rescheduled
completed
cancelled
```

Allowed services:

```txt
Services are managed dynamically through /services.
Seed defaults: Newborn, Maternity, Birthday, Wedding, Portrait, Fashion.
```

### Services

Public service APIs do not require login:

```txt
GET /services
GET /services/:slug
```

Admin/staff service APIs require Bearer token:

```txt
GET /services/admin/all?page=1&limit=20
POST /services
PATCH /services/:id/cover-image
PATCH /services/:id
PATCH /services/:id/status
DELETE /services/:id
```

Create service body:

```json
{
  "title": "Newborn",
  "slug": "newborn",
  "subtitle": "Gentle newborn photography sessions",
  "description": "Soft, safe, and timeless newborn photography.",
  "coverImage": "https://example.com/newborn.jpg",
  "startingPrice": 5000,
  "isActive": true,
  "displayOrder": 1,
  "seoTitle": "Newborn Photography - The Cool Kids Studio",
  "seoDescription": "Book newborn photography sessions with The Cool Kids Studio.",
  "defaultDurationMinutes": 60,
  "availablePackages": [
    {
      "name": "Starter Package",
      "price": 5000,
      "durationMinutes": 60,
      "description": "A focused studio session.",
      "isActive": true,
      "displayOrder": 1
    }
  ]
}
```

Seed default services:

```bash
npm run seed:services
```

### Uploads

Admin/staff upload APIs require Bearer token and `multipart/form-data`.

```txt
GET /uploads/images?page=1&limit=20
GET /uploads/images?context=service_cover&page=1&limit=20
POST /uploads/images
PATCH /services/:id/cover-image
```

`POST /uploads/images` form-data:

```txt
image: <file>
context: service_cover | gallery | testimonial | general
```

`PATCH /services/:id/cover-image` form-data:

```txt
image: <file>
```

Allowed image types:

```txt
image/jpeg
image/png
image/webp
image/avif
```

Max image size:

```txt
10MB
```

Frontend must send uploads as `multipart/form-data`, not JSON/base64. Example:

```js
const formData = new FormData()
formData.append('image', file)
formData.append('context', 'service_cover')

await fetch(`${API_BASE_URL}/uploads/images`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`
  },
  body: formData
})
```

Do not manually set the `Content-Type` header for `FormData`; the browser will set the multipart boundary.

Upload response includes Cloudinary URL and database asset metadata:

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "_id": "...",
    "publicId": "the-cool-kids/services/covers/abc",
    "secureUrl": "https://res.cloudinary.com/...",
    "width": 1200,
    "height": 800,
    "context": "service_cover"
  }
}
```

## Suggested Test Order

1. `GET /health`
2. `POST /auth/register`
3. `POST /auth/login`
4. `GET /auth/me`
5. `GET /services`
6. `POST /uploads/images` with token and multipart image
7. `GET /bookings/availability?date=2026-05-01&serviceSlug=newborn&package=Starter%20Package`
8. `POST /bookings`
9. `GET /bookings` without token should fail
10. `GET /bookings` with token should pass
11. `GET /bookings/:id`
12. `PATCH /bookings/:id`
13. `PATCH /bookings/:id/status`
14. `POST /auth/refresh`
15. `POST /auth/logout`

## Notes

- If `/auth/register` returns `Only an admin can create internal users`, it means an admin already exists. Use `/auth/login`.
- If auth routes rate-limit, wait 15 minutes or change the auth test email.
- Access token expires after 15 minutes.
- Refresh token is stored in Redis and expires after 7 days.

## Google Calendar Setup

Google Calendar is optional. Without Google env, availability still works using MongoDB bookings.

Add these env vars when ready:

```txt
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_ID=your_calendar_id
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Then share the target Google Calendar with the service account email.

## Brevo Email Setup

Brevo emails are optional. Without Brevo env, booking and status APIs still work and email sending is skipped safely.

Booking email flow:

```txt
POST /bookings
-> customer receives booking request email
-> admin receives new booking email

PATCH /bookings/:id/status
-> customer receives confirmed/cancelled/rescheduled/completed email when status matches
```

Add these env vars when ready:

```txt
BREVO_ENABLED=true
BREVO_API_KEY=your_brevo_smtp_api_key
BREVO_SENDER_EMAIL=verified-sender@example.com
BREVO_SENDER_NAME=The Cool Kids Studio
ADMIN_NOTIFICATION_EMAIL=admin@example.com
```

Brevo dashboard path:

```txt
Brevo -> SMTP & API -> API Keys -> Generate a new API key
Brevo -> Senders & IP -> Senders -> Add/verify sender email
```

## Cloudinary Setup

Cloudinary image uploads require:

```txt
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=the-cool-kids
```
