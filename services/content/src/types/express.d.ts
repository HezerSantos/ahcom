import 'express'; 
export{}
declare global {
  namespace Express {
    // Define the shape right here so you don't have to import anything
    interface User {
      id: string;
      email: string;
      role?: string;
    }

    interface Request {
      user?: User;
      content?: Record<string, any>
    }
  }
}