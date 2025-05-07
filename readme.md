# Test Project

## Debugging & Optimisation

# NodeJS

**Existing Code**

```javascript
import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

app.get('/users/:id', async (req, res) => {
  const userId = req.params.id;

  await client.connect();
  const db = client.db('testDB');

  const userCollection = db.collection('users');

  try {
    const users = await usersCollection.find().toArray();
    const user = users.find(user => user.id === userId);

    if (!user) {
      throw new Error('User not found');
    }

    let sum = 0;
    for (let i = 0; i < 1000000000; i++) {
      sum += i;
    }

    res.json({ user, sum });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

**Improved Solution**

```javascript
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { body, param, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

// Database configuration
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'testDB';
const collectionName = 'users';

// Create a singleton MongoDB client
let client;
let db;

// Initialize database connection
async function connectToDatabase() {
  try {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10 // Connection pooling for better performance
    });
    
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await client.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Middleware for request validation
const validateUserId = [
  param('id').isString().trim().notEmpty()
    .withMessage('Valid user ID is required'),
];

// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
}

// Get user by ID endpoint
app.get('/users/:id', validateUserId, async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id;
    const userCollection = db.collection(collectionName);
    
    // Use MongoDB's query capabilities directly
    const user = await userCollection.findOne({ id: userId });
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    
    // Send response
    res.json({ user });
    
  } catch (error) {
    next(error);
  }
});

// Register error handler
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;

// Connect to DB before starting server
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to start server:', error);
  });

// For graceful shutdown
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
```

# Angular

**Existing Code**
```javascript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-list',
  template: `
    <div *ngIf="error">{{ error }}</div>
    <ul *ngIf="users">
      <li *ngFor="let user of users">{{ user.name }}</li>
    </ul>
  `,
})
export class UserListComponent {
  users: any[] = [];
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.http.get('http://localhost:3000/users')
      .subscribe((response: any) => {
        this.users = response;
        this.error = error.message;
      });
  }
}
```

**Improved Solution**
```javascript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, catchError, finalize, throwError } from 'rxjs';
import { environment } from '../environments/environment';

// Define a proper interface for User objects
interface User {
  id: number;
  name: string;
  // Add other properties as needed
}

@Component({
  selector: 'app-user-list',
  template: `
    <div *ngIf="loading" class="loading">Loading users...</div>
    <div *ngIf="error" class="error-message">{{ error }}</div>
    <ul *ngIf="users && users.length">
      <li *ngFor="let user of users">{{ user.name }}</li>
    </ul>
    <div *ngIf="users && !users.length && !loading">No users found</div>
  `,
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  error: string = '';
  loading: boolean = false;
  private subscription: Subscription | null = null;
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    this.fetchUsers();
  }
  
  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  fetchUsers(): void {
    this.loading = true;
    this.error = '';
    
    this.subscription = this.http
      .get<User[]>(`${environment.apiUrl}/users`)
      .pipe(
        catchError(this.handleError),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: User[]) => {
          this.users = response;
        },
        error: (error: string) => {
          this.error = error;
        }
      });
  }
  
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    return throwError(() => errorMessage);
  }
}
```

## Systems Architecture

### Frontend
- **Framework:** Angular
- **API Communication:** HTTP requests
- **Authentication:** Express sessions

### Backend
- **Authentication:** Express session
- **Database:** MySQL
- **Error Handling:** Minimal logging, no structured error responses
- **Background Tasks:** Blocking synchronous tasks in API requests

### API Gateway
- **Rate Limiting:** None - API is exposed with no request throttling
- **Load Balancing:** Single Node.js server without redundancy
- **Security Measures:** CORS misconfigured, no request validation

### Deployment & Infrastructure
- **Containerization:** Direct Node.js deployment
- **CI/CD:** Manual server updates
- **Cloud Provider:** VPS Instance
- **Storage:** S3


