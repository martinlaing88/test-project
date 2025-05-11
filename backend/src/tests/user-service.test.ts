import { UserService } from '../services/user.service';
import { UserCreateDTO, UserUpdateDTO } from '../types/user';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
    beforeEach(() => {
        (UserService as any).users = [];
        (UserService as any).idCounter = 1;
    });

    it('should create a user and return a sanitized user object', async () => {
        const userData: UserCreateDTO = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123'
        };

        mockedBcrypt.hash.mockImplementationOnce(() => Promise.resolve('hashedpassword'));


        const user = await UserService.createUser(userData);

        expect(user).toMatchObject({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com'
        });

        expect(user).not.toHaveProperty('password');
    });

    it('should fetch all users', async () => {
        const user1 = await UserService.createUser({
            name: 'Alice',
            email: 'alice@example.com',
            password: 'secret1'
        });

        const user2 = await UserService.createUser({
            name: 'Bob',
            email: 'bob@example.com',
            password: 'secret2'
        });

        const users = await UserService.getUsers();

        expect(users.length).toBe(2);
        expect(users).toEqual([user1, user2]);
    });

    it('should get a user by ID', async () => {
        const createdUser = await UserService.createUser({
            name: 'Jane',
            email: 'jane@example.com',
            password: 'password'
        });

        const fetchedUser = await UserService.getUserById(createdUser.id);

        expect(fetchedUser).toEqual(createdUser);
    });

    it('should return null for non-existing user ID', async () => {
        const user = await UserService.getUserById(999);
        expect(user).toBeNull();
    });

    it('should get a user by email', async () => {
        const createdUser = await UserService.createUser({
            name: 'Tom',
            email: 'tom@example.com',
            password: 'password'
        });

        const fetchedUser = await UserService.getUserByEmail('tom@example.com');
        expect(fetchedUser).toEqual(createdUser);
    });

    it('should return null for non-existing email', async () => {
        const user = await UserService.getUserByEmail('nonexistent@example.com');
        expect(user).toBeNull();
    });

    it('should update a user\'s name and email', async () => {
        const createdUser = await UserService.createUser({
            name: 'Old Name',
            email: 'old@example.com',
            password: 'password'
        });

        const updatedUser = await UserService.updateUser(createdUser.id, {
            name: 'New Name',
            email: 'new@example.com'
        });

        expect(updatedUser.name).toBe('New Name');
        expect(updatedUser.email).toBe('new@example.com');
    });

    it('should throw an error when updating a non-existing user', async () => {
        await expect(
            UserService.updateUser(999, { name: 'Ghost' })
        ).rejects.toThrow('Failed to update user');
    });

    it('should delete a user and return true', async () => {
        const user = await UserService.createUser({
            name: 'Delete Me',
            email: 'deleteme@example.com',
            password: 'password'
        });

        const result = await UserService.deleteUser(user.id);
        expect(result).toBe(true);

        const users = await UserService.getUsers();
        expect(users).toHaveLength(0);
    });

    it('should throw error when deleting a non-existing user', async () => {
        await expect(UserService.deleteUser(999)).rejects.toThrow('Failed to delete user');
    });

    it('should verify credentials correctly', async () => {
        mockedBcrypt.hash.mockImplementationOnce(() => Promise.resolve('hashed123'));

        mockedBcrypt.compare.mockImplementationOnce(() => Promise.resolve(true));


        await UserService.createUser({
            name: 'Auth User',
            email: 'auth@example.com',
            password: 'plain123'
        });

        const user = await UserService.verifyCredentials('auth@example.com', 'plain123');
        expect(user).not.toBeNull();
        expect(user?.email).toBe('auth@example.com');
    });

    it('should return null for wrong password', async () => {
        mockedBcrypt.hash.mockImplementationOnce(() => Promise.resolve('hashed123'));

        mockedBcrypt.compare.mockImplementationOnce(() => Promise.resolve(false));


        await UserService.createUser({
            name: 'WrongPass',
            email: 'wrongpass@example.com',
            password: 'password'
        });

        const user = await UserService.verifyCredentials('wrongpass@example.com', 'wrong');
        expect(user).toBeNull();
    });

    it('should return null for non-existent email on verifyCredentials', async () => {
        const result = await UserService.verifyCredentials('noone@example.com', 'pass');
        expect(result).toBeNull();
    });
});
