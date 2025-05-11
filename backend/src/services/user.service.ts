import { User, UserCreateDTO, UserUpdateDTO } from "../types/user";
import bcrypt from 'bcrypt';

/**
 * Service handling user-related business logic and data access
 */
export class UserService {

    private static users: User[] = [];

    private static idCounter: number = 1;

    static async getUsers(): Promise<User[]> {
        return this.users.map(user => this.sanitizeUser(user));
    }

    /**
     * Get a user by their ID
     * @param id User ID
     * @returns User object or null if not found
     */
    static async getUserById(id: number): Promise<User | null> {
        try {
            const user = this.users.find(u => u.id === id);
            return user ? this.sanitizeUser(user) : null;
        } catch (error) {
            throw new Error('Failed to fetch user');
        }
    }

    /**
     * Get a user by their email
     * @param email User email
     * @returns User object or null if not found
     */
    static async getUserByEmail(email: string): Promise<User | null> {
        try {
            const user = this.users.find(u => u.email === email);
            return user ? this.sanitizeUser(user) : null;
        } catch (error) {
            throw new Error('Failed to fetch user by email');
        }
    }

    /**
     * Create a new user
     * @param userData User data object
     * @returns Created user object
     */
    static async createUser(userData: UserCreateDTO): Promise<User> {
        try {
            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            
            // Create new user with current timestamp
            const now = new Date();
            const newUser: User = {
                id: this.idCounter++,
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
                createdAt: new Date()
            };
            
            this.users.push(newUser);
            
            // Return user without password
            return this.sanitizeUser(newUser);
        } catch (error) {
            throw new Error('Failed to create user');
        }
    }

    /**
     * Update an existing user
     * @param id User ID
     * @param userData User data to update
     * @returns Updated user object
     */
    static async updateUser(id: number, userData: UserUpdateDTO): Promise<User> {
        try {
            const userIndex = this.users.findIndex(u => u.id === id);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            
            const user = this.users[userIndex];

            if (userData.name !== undefined) {
                user.name = userData.name;
            }
            
            if (userData.email !== undefined) {
                user.email = userData.email;
            }

            if (userData.role !== undefined) {
                user.role = userData.role;
            }

            return this.sanitizeUser(user);
        } catch (error) {
            throw new Error('Failed to update user');
        }
    }

    /**
     * Delete a user
     * @param id User ID
     * @returns True if successful
     */
    static async deleteUser(id: number): Promise<boolean> {
        try {
            const userIndex = this.users.findIndex(u => u.id === id);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            
            this.users.splice(userIndex, 1);
            return true;
        } catch (error) {
            throw new Error('Failed to delete user');
        }
    }

    /**
     * Verify user credentials
     * @param email User email
     * @param password User password
     * @returns User object if credentials are valid, null otherwise
     */
    static async verifyCredentials(email: string, password: string): Promise<User | null> {
        try {
            const user = this.users.find(u => u.email === email);
            
            if (!user || !user.password) {
                return null;
            }
            
            // Verify password
            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                return null;
            }

            return this.sanitizeUser(user);
        } catch (error) {
            throw new Error('Failed to verify credentials');
        }
    }

    /**
     * Remove sensitive data from user object
     * @param user User object with potential sensitive data
     * @returns Sanitized user object
     */
    private static sanitizeUser(user: User): User {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }
}
