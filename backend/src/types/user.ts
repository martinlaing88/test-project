/**
 * Core User interface representing a user in the system
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  createdAt?: Date;
  password?: string;  // Optional in responses, required for storage
}

/**
 * Data Transfer Object for returning user data without sensitive information
 */
export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role?: string;
  createdAt?: Date;
  // Intentionally excludes password
}

/**
 * Data Transfer Object for creating a new user
 * Contains all required fields to create a valid user
 */
export interface UserCreateDTO {
  name: string;       // User's full name
  email: string;      // User's unique email address
  password: string;   // User's password (will be hashed before storage)
  role?: string;
}

/**
 * Data Transfer Object for updating an existing user
 * All fields are optional since updates can be partial
 */
export interface UserUpdateDTO {
  name?: string;      // Optional updated name
  email?: string;     // Optional updated email
  role?: string;
  // Note: password updates would typically use a separate endpoint
  // with additional verification
}
