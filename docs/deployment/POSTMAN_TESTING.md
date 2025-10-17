# Postman Backend Testing Guide

Complete testing guide for CRM Chatbot backend API endpoints.

## 🔧 **Base Configuration**

**Base URL:** `https://crm-chatbot-ei2d.onrender.com`

**Common Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
```

## 📋 **Test Sequence (Run in Order)**

### **1. Health Check**

**Method:** `GET`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/health`  
**Headers:** None required  
**Expected:** `200 OK` with `{"status":"healthy","timestamp":"..."}`

---

### **2. User Registration**

**Method:** `POST`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/auth/register`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
```

**Body:**

```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "first_name": "Test",
  "last_name": "User",
  "role": "agent"
}
```

**Expected:** `200 OK` with user data and token

---

### **3. User Login**

**Method:** `POST`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/auth/login`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
```

**Body:**

```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Expected:** `200 OK` with access token

**Save the token from response for next requests!**

---

### **4. Get Current User (with Auth)**

**Method:** `GET`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/auth/me`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:** `200 OK` with user data

---

### **5. Create Lead**

**Method:** `POST`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/leads`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "source": "website",
  "notes": "Test lead from Postman"
}
```

**Expected:** `200 OK` with lead data

---

### **6. Get All Leads**

**Method:** `GET`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/leads`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:** `200 OK` with array of leads

---

### **7. Create Campaign**

**Method:** `POST`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/campaigns`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body:**

```json
{
  "name": "Test Campaign",
  "description": "Test campaign from Postman",
  "start_date": "2025-10-17",
  "end_date": "2025-11-17",
  "budget": 1000,
  "status": "active"
}
```

**Expected:** `200 OK` with campaign data

---

### **8. Get All Campaigns**

**Method:** `GET`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/campaigns`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:** `200 OK` with array of campaigns

---

### **9. Create Meeting**

**Method:** `POST`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/meetings`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body:**

```json
{
  "lead_id": "LEAD_ID_FROM_STEP_5",
  "title": "Test Meeting",
  "start_time": "2025-10-20T10:00:00Z",
  "duration_minutes": 60,
  "notes": "Test meeting from Postman"
}
```

**Expected:** `200 OK` with meeting data

---

### **10. Get All Meetings**

**Method:** `GET`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/meetings`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:** `200 OK` with array of meetings

---

### **11. Create Support Ticket**

**Method:** `POST`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/tickets`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body:**

```json
{
  "title": "Test Ticket",
  "description": "Test support ticket from Postman",
  "priority": "medium",
  "status": "open",
  "lead_id": "LEAD_ID_FROM_STEP_5"
}
```

**Expected:** `200 OK` with ticket data

---

### **12. Get All Tickets**

**Method:** `GET`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/tickets`  
**Headers:**

```
Content-Type: application/json
Origin: https://crm-chatbot-tau.vercel.app
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:** `200 OK` with array of tickets

---

## 🚨 **Error Testing**

### **Test Invalid Login**

**Method:** `POST`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/auth/login`  
**Body:**

```json
{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}
```

**Expected:** `401 Unauthorized` or `400 Bad Request`

### **Test Without Auth Token**

**Method:** `GET`  
**URL:** `https://crm-chatbot-ei2d.onrender.com/api/leads`  
**Headers:** (No Authorization header)  
**Expected:** `401 Unauthorized`

---

## 📊 **Expected Response Formats**

### **Success Response:**

```json
{
  "id": "object_id",
  "field1": "value1",
  "field2": "value2",
  "created_at": "2025-10-17T10:00:00Z",
  "updated_at": "2025-10-17T10:00:00Z"
}
```

### **Error Response:**

```json
{
  "detail": "Error message"
}
```

### **Login Success Response:**

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user_id",
    "email": "testuser@example.com",
    "first_name": "Test",
    "last_name": "User",
    "role": "agent"
  }
}
```

---

## 🔍 **Troubleshooting**

### **If Health Check Fails:**

- Backend is not running
- Check Render dashboard
- Check MongoDB connection

### **If Registration/Login Fails:**

- Check CORS headers
- Verify MongoDB is connected
- Check backend logs in Render

### **If Auth Requests Fail:**

- Verify token is correct
- Check token format: `Bearer YOUR_TOKEN`
- Ensure token is not expired

### **Common Status Codes:**

- `200` - Success
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (invalid credentials/token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (endpoint doesn't exist)
- `500` - Internal Server Error (backend issue)

---

## 🎯 **Quick Test Checklist**

- [ ] Health check works
- [ ] Registration works
- [ ] Login works
- [ ] Auth token works
- [ ] All CRUD operations work
- [ ] Error handling works
- [ ] CORS headers present

Run these tests in order and let me know the results! 🚀
