import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, TextInput, Text, Alert, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import * as Finvu from 'finvu-react-native-sdk';
import { AccountLinking } from './src/utils/accountLinkingUtils';
import { useFinvu } from './src/context/FinvuContext';
import { styles } from './src/styles/sharedStyles';
import { useNavigation } from '@react-navigation/native';
import { HomePageNavigationProp, LinkedAccountsPageNavigationProp } from './src/types/navigation';
import { ROUTES } from './src/constants/routes';

export interface FinvuConfig {
  finvuEndpoint: string;
  certificatePins?: string[];
}

const Home = () => {

  const navigation = useNavigation<HomePageNavigationProp>();

  const { mobileNumber, userHandle, consentHandleId, setConsentHandleId, isLoggedIn, setIsLoggedIn, isConnected, setIsConnected, userId, setUserId } = useFinvu()
  // Basic state management
  const [otp, setOtp] = useState('');
  const [otpReference, setOtpReference] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ready to initialize');
  const [isLoading, setIsLoading] = useState(false);
  const [consentDetails, setConsentDetails] = useState<any>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);

  const config: FinvuConfig = {
    finvuEndpoint: 'wss://webvwdev.finvu.in/consentapi',
    certificatePins: [],
  };

  useEffect(() => {
    // Set up event listeners
    const connectionStatusSubscription = Finvu.addConnectionStatusChangeListener((event) => {
      setStatusMessage(`Connection status: ${event.status}`);
      setIsConnected(event.status === 'Connected successfully');
    });

    const loginOtpReceivedSubscription = Finvu.addLoginOtpReceivedListener((event) => {
      console.log('Login OTP received event:', event);
      // You can use this event to automatically fill in the OTP if it's delivered to the app
    });

    const loginOtpVerifiedSubscription = Finvu.addLoginOtpVerifiedListener((event) => {
      console.log('Login OTP verified event:', event);
      // Handle successful OTP verification
    });

    return () => {
      // Clean up event listeners
      connectionStatusSubscription.remove();
      loginOtpReceivedSubscription.remove();
      loginOtpVerifiedSubscription.remove();
    };
  }, []);

  // Initialize SDK
  const handleInitPress = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Initializing...');
      const result = await Finvu.initializeWith(config);

      if (result.isSuccess) {
        setStatusMessage(`Initialized: ${result.data}`);
      } else {
        setStatusMessage(`Init failed: ${result.error.message}`);
        Alert.alert('Initialization Error', result.error.message);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setStatusMessage(`Init failed: ${error}`);
      Alert.alert('Initialization Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to service
  const handleConnectPress = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Connecting...');
      const result = await Finvu.connect();

      if (result.isSuccess) {
        setStatusMessage('Connected successfully');
        const isConnectedResult = await Finvu.isConnected();
        const hasSessionResult = await Finvu.hasSession();
        console.log('new method result', 'isConnnected : ', isConnectedResult, 'hasSession : ', hasSessionResult)
        setIsConnected(true);
      } else {
        setStatusMessage(`Connection failed: ${result.error.message}`);
        Alert.alert('Connection Error', result.error.message);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStatusMessage(`Connection failed: ${error}`);
      Alert.alert('Connection Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to service
  const handleDisconnectPress = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Connecting...');
      const result = await Finvu.disconnect();

      if (result.isSuccess) {
        const isConnectedResult = await Finvu.isConnected();
        const hasSessionResult = await Finvu.hasSession();
        console.log('new method result', 'isConnnected : ', isConnectedResult, 'hasSession : ', hasSessionResult)
        setStatusMessage('Disconnected successfully');
        setIsConnected(false);
      } else {
        setStatusMessage(`Failed to Disconnect: ${result.error.message}`);
        Alert.alert('`Failed to Disconnect', result.error.message);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStatusMessage(`Connection failed: ${error}`);
      Alert.alert('Connection Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Login with username or mobile
  const handleLoginPress = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Logging in...');
      const result = await Finvu.loginWithUsernameOrMobileNumber(
        userHandle,
        mobileNumber,
        consentHandleId,
      );

      console.log('Login result:', result);

      if (result.isSuccess) {
        if (result.data.reference) {
          setOtpReference(result.data.reference);
          setStatusMessage(`Login initiated. OTP sent. Reference: ${result.data.reference}`);
        }
      } else {
        setStatusMessage(`Login failed: ${result.error.message}`);
        Alert.alert("Login Failed", result.error.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setStatusMessage(`Login failed: ${error}`);
      Alert.alert('Login Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Verify login OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Missing OTP", "Please enter the OTP you received");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage('Verifying OTP...');
      const result = await Finvu.verifyLoginOtp(otp, otpReference);

      if (result.isSuccess) {
        if (result.data.userId) {
          setUserId(result.data.userId);
          setIsLoggedIn(true);
          setStatusMessage(`OTP Verified. User ID: ${result.data.userId}`);

          // After successful login, fetch user's consent details
          await fetchConsentDetails();

          // Also fetch linked accounts
          await fetchLinkedAccounts();
        }
      } else {
        setStatusMessage(`OTP verification failed: ${result.error.message}`);
        Alert.alert("OTP Verification Failed", result.error.message);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setStatusMessage(`OTP verification failed: ${error}`);
      Alert.alert('OTP Verification Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's linked accounts
  const fetchLinkedAccounts = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Fetching linked accounts...');
      const result = await Finvu.fetchLinkedAccounts();

      if (result.isSuccess) {
        const accounts = result.data.linkedAccounts || [];
        setLinkedAccounts(accounts);
        setStatusMessage(`Found ${accounts.length} linked accounts`);
        console.log("Linked Accounts:", accounts);
      } else {
        setStatusMessage(`Fetch failed: ${result.error.message}`);
        Alert.alert("Fetch Failed", result.error.message);
      }
    } catch (error) {
      console.error('Fetch linked accounts error:', error);
      setStatusMessage(`Fetch failed: ${error}`);
      Alert.alert('Fetch Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch consent request details
  const fetchConsentDetails = async () => {
    if (!consentHandleId) {
      Alert.alert("Missing Consent Handle ID", "Please provide a consent handle ID");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage('Fetching consent details...');
      const result = await Finvu.getConsentRequestDetails(consentHandleId);

      if (result.isSuccess) {
        setConsentDetails(result.data);
        setStatusMessage(`Consent details fetched successfully`);
        console.log("Consent Details:", result.data);
      } else {
        setStatusMessage(`Fetch consent details failed: ${result.error.message}`);
        Alert.alert("Fetch Consent Failed", result.error.message);
      }
    } catch (error) {
      console.error('Fetch consent details error:', error);
      setStatusMessage(`Fetch consent details failed: ${error}`);
      Alert.alert('Fetch Consent Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Approve a consent request
  const handleApproveConsent = async () => {
    try {
      console.log("Consent Details:", consentDetails);

      // Don't modify the object, but make a deep clone to ensure data structure is preserved
      // and passed properly to the native side
      const consentDetailToSend = consentDetails.consentDetail;

      // Use linkedAccounts directly as they're already in the correct format from fetchLinkedAccounts
      const accountsToSend = linkedAccounts.length > 0 ? linkedAccounts : [];

      console.log("Sending consent detail:", consentDetailToSend);
      console.log("Sending accounts:", accountsToSend);

      const result = await Finvu.approveConsentRequest(
        consentDetailToSend,
        accountsToSend
      );
      console.log("Consent Approval result:", result);
      if (result.isSuccess) {
        setStatusMessage('Consent request approved successfully');
        Alert.alert("Success", "Consent request approved successfully");
      } else {
        console.error("Consent approval failed:", result.error);
        setStatusMessage(`Consent approval failed: ${result.error.message}`);
        Alert.alert("Consent Approval Failed", result.error.message);
      }
    } catch (error) {
      console.error("Error in handleApproveConsent:", error);
      setStatusMessage(`Consent approval failed: ${error}`);
      Alert.alert('Consent Approval Error', String(error));
    } finally {
       setTimeout(() => handleLogout(),2000) 
    }
  };

  // Deny a consent request
  const denyConsentRequest = async () => {
    if (!consentDetails) {
      Alert.alert("Missing Consent Details", "Please fetch consent details first");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage('Denying consent request...');

      const result = await Finvu.denyConsentRequest(consentDetails.consentDetail);

      if (result.isSuccess) {
        setStatusMessage('Consent request denied successfully');
        Alert.alert("Success", "Consent request denied successfully");
      } else {
        setStatusMessage(`Consent denial failed: ${result.error.message}`);
        Alert.alert("Consent Denial Failed", result.error.message);
      }
    } catch (error) {
      console.error('Deny consent error:', error);
      setStatusMessage(`Consent denial failed: ${error}`);
      Alert.alert('Consent Denial Error', String(error));
    } finally {
      setIsLoading(false);
      setTimeout(() => handleLogout(),2000)
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Logging out...');
      const result = await Finvu.logout();

      if (result.isSuccess) {
        setIsLoggedIn(false);
        setUserId('');
        setOtp('');
        setOtpReference('');
        setLinkedAccounts([]);
        setConsentDetails(null);
        setStatusMessage('Logged out successfully');
      } else {
        setStatusMessage(`Logout failed: ${result.error.message}`);
        Alert.alert("Logout Failed", result.error.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setStatusMessage(`Logout failed: ${error}`);
      Alert.alert('Logout Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced UI with loading indicator
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Finvu SDK Demo</Text>
      <Text style={styles.status}>{statusMessage}</Text>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setup</Text>
        <Button title="Initialize SDK" onPress={handleInitPress} disabled={isLoading} />
        <View style={styles.buttonMargin} />
        <Button
          title={isConnected ? "Connected" : "Connect to Service"}
          onPress={handleConnectPress}
          disabled={isConnected || isLoading}
        />
        <View style={styles.buttonMargin} />
        {!isLoggedIn && <Button
          title={!isConnected ? "Disconnected" : "Disconnect from Service"}
          onPress={handleDisconnectPress}
          disabled={!isConnected || isLoading}
        />}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>
        <Button
          title="Login"
          onPress={handleLoginPress}
          disabled={!isConnected || isLoggedIn || isLoading}
        />
        <View style={styles.buttonMargin} />

        {otpReference && !isLoggedIn && (
          <>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter Login OTP"
              keyboardType="number-pad"
              editable={!isLoading}
            />

            <Button
              title="Verify OTP"
              onPress={handleVerifyOtp}
              disabled={!otp || isLoading}
            />
          </>
        )}

        {isLoggedIn && (
          <>
            <Text style={styles.infoText}>User ID: {userId}</Text>
            <View style={styles.buttonMargin} />
            <Button title="Logout" onPress={handleLogout} disabled={isLoading} />
          </>
        )}
      </View>

      {isLoggedIn && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Management</Text>
            <Button
              title="Fetch Linked Accounts"
              onPress={fetchLinkedAccounts}
              disabled={isLoading}
            />

            {linkedAccounts.length > 0 && (
              <>
                <View style={styles.buttonMargin} />
                <Text style={styles.infoText}>
                  Linked Accounts: {linkedAccounts.length}
                </Text>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Management</Text>
            <Button
              title="Link Accounts"
              onPress={() => navigation.navigate(ROUTES.LINKED_ACCOUNTS)}
              disabled={isLoading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consent Management</Text>
            <TextInput
              style={styles.input}
              value={consentHandleId}
              onChangeText={setConsentHandleId}
              placeholder="Enter Consent Handle ID"
              editable={!isLoading}
            />
            <Button
              title="Fetch Consent Details"
              onPress={fetchConsentDetails}
              disabled={!consentHandleId || isLoading}
            />

            {consentDetails && (
              <>
                <View style={styles.buttonMargin} />
                <Text style={styles.infoText}>
                  Consent Purpose: {consentDetails?.consentDetail?.consentPurpose?.text || 'N/A'}
                </Text>
                <View style={styles.buttonMargin} />
                <View style={styles.buttonRow}>
                  <Button
                    title="Approve Consent"
                    onPress={handleApproveConsent}
                    disabled={linkedAccounts.length === 0 || isLoading}
                    color="#4CAF50"
                  />
                  <View style={styles.buttonSpacer} />
                  <Button
                    title="Deny Consent"
                    onPress={denyConsentRequest}
                    disabled={isLoading}
                    color="#F44336"
                  />
                </View>
              </>
            )}
          </View>
        </>
      )}

      <Text style={styles.note}>Check the console for detailed results</Text>
    </ScrollView>
  );
};



export default Home;