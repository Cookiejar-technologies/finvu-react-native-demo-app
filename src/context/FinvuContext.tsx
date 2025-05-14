import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FinvuContextProps {
  mobileNumber: string;
  setMobileNumber: (value: string) => void;
  userHandle: string;
  setUserHandle: (value: string) => void;
  consentHandleId: string;
  setConsentHandleId: (value: string) => void;
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  userId: string;
  setUserId: (value: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
}

const FinvuContext = createContext<FinvuContextProps | undefined>(undefined);

export const FinvuProvider = ({ children }: { children: ReactNode }) => {
  const [mobileNumber, setMobileNumber] = useState('mobile_number');
  const [userHandle, setUserHandle] = useState('user_handle');
  const [consentHandleId, setConsentHandleId] = useState('consent_handle');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState('');

  return (
    <FinvuContext.Provider
      value={{
        mobileNumber,
        setMobileNumber,
        userHandle,
        setUserHandle,
        consentHandleId,
        setConsentHandleId,
        isConnected,
        setIsConnected,
        userId,
        setUserId,
        isLoggedIn,
        setIsLoggedIn,
      }}
    >
      {children}
    </FinvuContext.Provider>
  );
};

export const useFinvu = (): FinvuContextProps => {
  const context = useContext(FinvuContext);
  if (!context) {
    throw new Error('useFinvu must be used within a FinvuProvider');
  }
  return context;
};
