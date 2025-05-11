# Test Project

### NodeJS API

**Setup**
```bash
npm install
npm run dev
```

API should be running at http://localhost:3000/
Example postman collection can be found in the **Test Node API.postman_collection.json file**.

**Tests**
```bash
npm run test
```

### Angular Component

Before running frontend ensure backend is running and register a user to get a JWT token - this needs set in localstorage with the key of token, as for simplicity there is no frontend login component implemented.

**Setup**
```bash
npm install
ng serve
```
Application should be running at http://localhost:4200/

**Tests**
```bash
ng test
```

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

- **Removed Performance Bottleneck**
  - Eliminated the unnecessary loop that was calculating a sum of 1 billion numbers.
  - This alone will give you a massive performance improvement, as this operation was completely unnecessary and would cause each request to take several seconds.
- **Efficient Database Querying**
  - Changed from find().toArray() + JavaScript filtering to using MongoDB's findOne() method with a direct query.
  - This optimizes both performance and memory usage by returning only the specific user instead of all users.
- **Proper Connection Management**
  - Implemented a singleton connection pattern that establishes the MongoDB connection once when the server starts.
  - Added connection pooling with maxPoolSize to handle concurrent requests efficiently.
  - Included graceful shutdown handling to properly close the connection.
- **Enhanced Error Handling**
  - Added a dedicated error handling middleware for consistent error responses.
  - Implemented proper HTTP status codes (404 for user not found, etc.).
  - Added stack traces in non-production environments for easier debugging.
- **Input Validation**
  - Added request validation using express-validator.
  - Implemented proper error responses for invalid inputs.
- **Code Organization**
  - Separated database connection logic for better maintainability.
  - Used environment variables for configuration.
- **Security Best Practices**
  - Avoided exposing stack traces in production.
  - Added proper error handling for uncaught exceptions.

**Additional Recommendations**

- **Authentication & Authorization**
  - Consider adding middleware for authentication to secure the API.
- **Rate Limiting**
  - Implement rate limiting to prevent abuse (using a package like express-rate-limit).
- **Caching**
  - For frequently accessed users, consider implementing caching with Redis.
- **Logging**
  - Add structured logging for better monitoring and debugging.

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

- **Lifecycle Hook Implementation**
  - Issue: The ngOnInit() method is not properly implemented - it's missing the interface implementation.
  - Suggestion: Implement the OnInit interface from @angular/core.
- **Error Handling**
  - Issue: The error handling in the subscribe method is incorrect. The error parameter is not defined in the callback.
  - Suggestion: Use the proper error callback in the subscribe method.
- **Type Safety**
  - Issue: Using any[] for users and generic any response type reduces type safety.
  - Suggestion: Create a proper interface for the user object and use it for typing.
- **Subscription Management**
  - Issue: No management of the HTTP subscription, which can lead to memory leaks.
  - Suggestion: Store the subscription and unsubscribe in ngOnDestroy().
- **HTTP Error Strategy**
  - Issue: Direct assignment of error message without proper error handling strategy.
  - Suggestion: Implement a more robust error handling approach.
- **Missing HTTP Error Handling**
  - Issue: No handling for network errors or server errors.
  - Suggestion: Add proper error handling with status codes and user-friendly messages.
- **Hard-coded API URL**
  - Issue: The API URL is hard-coded in the component.
  - Suggestion: Use environment configuration or a service for API URLs.

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

## Improvements

## Scalability Improvements

- **Load Balancing:**
  - Replace single Node.js server with a proper load balancer (e.g., NGINX, AWS ELB) with multiple backend instances.
- **Database Scalability:**
  - Add read replicas for MySQL to handle high-read traffic
  - Consider implementing database sharding for large datasets
  - Evaluate connection pooling to manage database connections efficiently

- **Containerization:**
  - Move from direct Node.js deployment to Docker containers
  - Consider Kubernetes for orchestration to enable auto-scaling
  
- **Background Tasks:**
  - Migrate from blocking synchronous tasks to message queues (RabbitMQ, SQS)

## Performance Improvements

- **Caching Strategy:**
  - Implement Redis/Memcached for caching frequent database queries
  - Add CDN for static asset delivery
  - Implement browser caching strategies

- **API Optimization:**
  - Enable HTTP/2 for multiplexing requests
  - Implement GraphQL for more efficient data fetching where appropriate
  - Add compression for API responses

- **Database Performance:**
  - Add proper indexing strategy for MySQL
  - Consider adding NoSQL solutions for specific use cases requiring high throughput

## Security Enhancements

- **Authentication:**
  - Replace Express sessions with JWT tokens for stateless authentication
  - Implement OAuth 2.0 or OpenID Connect for standardized authentication
  - Add refresh token rotation for enhanced security

- **API Gateway Security:**
  - Implement rate limiting to prevent abuse
  - Add proper request validation and sanitization
  - Fix CORS configuration to follow principle of least privilege

- **Infrastructure Security:**
  - Implement proper network segmentation
  - Add intrusion detection systems
  - Configure proper IAM roles and policies for cloud resources
  - Enable encryption at rest and in transit

## Maintainability Improvements

- **CI/CD Pipeline:**
  - Replace manual updates with automated CI/CD (GitHub Actions, Jenkins, etc.)
  - Implement blue/green or canary deployments for safe releases
  - Add automated testing in the pipeline

- **Monitoring & Observability:**
  - Implement structured logging (Winston, Bunyan)
  - Add application performance monitoring (New Relic, Datadog)
  - Set up centralized logging with ELK stack or similar
  - Implement health checks and alerts

- **Error Handling:**
  - Create standardized error response format
  - Implement global error handling middleware
  - Add proper logging levels and correlation IDs for request tracing

- **Documentation:**
  - Add API documentation with Swagger/OpenAPI
  - Implement automated documentation generation
  - Create runbooks for common operational tasks

## Cloud & Infrastructure Recommendations

- **Cloud Migration:**
  - Move from VPS to managed cloud services (AWS, Azure, GCP)
  - Utilize auto-scaling groups for dynamic capacity
  - Implement infrastructure as code (Terraform, CloudFormation)

## Disaster Recovery:

- Implement regular database backups
- Create multi-region deployment strategy
- Define and test disaster recovery procedures


