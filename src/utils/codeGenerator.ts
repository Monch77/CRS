// Store generated codes with their expiration dates
const generatedCodes: Map<string, Date> = new Map();

// Function to generate a random code (one letter and one digit)
export const generateUniqueCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  let code: string;
  let isUnique = false;
  
  // Keep generating until we find a unique code
  while (!isUnique) {
    const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
    const randomDigit = digits.charAt(Math.floor(Math.random() * digits.length));
    
    code = `${randomLetter}${randomDigit}`;
    
    // Check if the code exists and hasn't expired
    const expirationDate = generatedCodes.get(code);
    const now = new Date();
    
    if (!expirationDate || expirationDate < now) {
      isUnique = true;
    }
  }
  
  // Set expiration date (7 days from now - extended from 2 days)
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  
  // Store the code with its expiration date
  generatedCodes.set(code!, expirationDate);
  
  return code!;
};

// Function to check if a code is valid
export const isCodeValid = (code: string): boolean => {
  if (!code) return false;
  
  // Normalize the code to uppercase for consistent comparison
  const normalizedCode = code.toUpperCase();
  
  const expirationDate = generatedCodes.get(normalizedCode);
  
  if (!expirationDate) {
    // Check if there's an order with this code in localStorage
    try {
      const orders = JSON.parse(localStorage.getItem('courier_rating_orders') || '[]');
      const orderWithCode = orders.find((order: any) => 
        order.code && 
        order.code.toUpperCase() === normalizedCode && 
        (order.status === 'assigned' || order.status === 'in-progress')
      );
      
      if (orderWithCode) {
        // If order found, add code to Map with expiration date 7 days from now
        const newExpirationDate = new Date();
        newExpirationDate.setDate(newExpirationDate.getDate() + 7);
        generatedCodes.set(normalizedCode, newExpirationDate);
        return true;
      }
    } catch (error) {
      console.error('Error checking order code:', error);
    }
    
    return false;
  }
  
  const now = new Date();
  return expirationDate > now;
};

// Function to invalidate a code after it's been used
export const invalidateCode = (code: string): void => {
  if (!code) return;
  generatedCodes.delete(code.toUpperCase());
};