import React, { createContext, useContext } from 'react';

interface UserData {
  name: string;
  email: string;
  handle: string;
  profileImage: string | null;
}

interface EmailCheckResult {
  allowed: boolean;
  remaining: number | 'unlimited';
  isCreator: boolean;
  hasUsedPostcard: boolean;
  message: string;
}

interface UserContextType {
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
  emailCheckResult: EmailCheckResult | null;
  setEmailCheckResult: React.Dispatch<React.SetStateAction<EmailCheckResult | null>>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
