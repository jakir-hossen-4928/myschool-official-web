
import { Client, Account, Databases, Storage } from 'appwrite';

// Create a client
const client = new Client();

// Set default values if environment variables are not set
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '676984e50037cf350bb8';

// Configure the client
client
    .setEndpoint(endpoint)
    .setProject(projectId);

// Export the client and services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { client };
