import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, TextInput, Text, Alert, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import * as Finvu from '@cookiejar-technologies/finvu-react-native-sdk';
import { AccountLinking } from './src/utils/accountLinkingUtils';
import { useFinvu } from './src/context/FinvuContext';
import { styles } from './src/styles/sharedStyles';
import { useNavigation } from '@react-navigation/native';
import { HomePageNavigationProp, LinkedAccountsPageNavigationProp } from './src/types/navigation';
import { ROUTES } from './src/constants/routes';
import { EventsDisplay, FinvuEvent } from './src/components/EventsDisplay';

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
  const [events, setEvents] = useState<FinvuEvent[]>([]);

  const config: Finvu.FinvuConfig = {
    finvuEndpoint: 'wss://webvwdev.finvu.in/consentapiv2',
    certificatePins: [],
    finvuAuthSNAConfig : {
      environment: Finvu.FinvuEnviornment.UAT,
    }
  };

  useEffect(() => {
    // Enable event tracking early (required!)
    // This ensures events are captured from the start
    if (Finvu.setEventsEnabled) {
      const enableResult = Finvu.setEventsEnabled(true);
      if (enableResult?.isSuccess) {
        console.log('✅ Event tracking enabled (on mount)');
      } else {
        console.warn('⚠️ Event tracking enable result:', enableResult);
      }
    }

    // Register custom events (optional)
    if (Finvu.registerCustomEvents) {
      Finvu.registerCustomEvents({
        'USER_BUTTON_CLICKED': {
          category: 'ui',
          count: 0,
        },
        'SCREEN_VIEWED': {
          category: 'navigation',
          count: 0,
        },
      });
    }

    // Register event aliases (optional)
    if (Finvu.registerAliases && Finvu.FinvuEventType) {
      Finvu.registerAliases({
        [Finvu.FinvuEventType.LOGIN_OTP_VERIFIED]: 'user_login_success',
        [Finvu.FinvuEventType.CONSENT_APPROVED]: 'consent_granted',
        [Finvu.FinvuEventType.LINKING_SUCCESS]: 'account_linked',
      });
    }

    // Add unified event tracking listener (replaces individual listeners)
    let eventTrackingSubscription: any = null;
    if (Finvu.addEventListener) {
      eventTrackingSubscription = Finvu.addEventListener((event: FinvuEvent) => {
        console.log('📊 Event received:', event.eventName);
        console.log('   Category:', event.eventCategory);
        console.log('   Timestamp:', event.timestamp);
        console.log('   Params:', event.params);

        // Add to local state for display (keep last 50 events)
        setEvents(prev => [event, ...prev].slice(0, 50));

        // Handle specific events (includes connection status, OTP, etc.)
        handleSpecificEvent(event);
      });
      console.log('✅ Unified event listener registered');
    } else {
      console.warn('⚠️ addEventListener not available in SDK');
    }

    return () => {
      // Clean up event listener
      if (eventTrackingSubscription?.remove) {
        eventTrackingSubscription.remove();
      }
    };
  }, []);

  const handleSpecificEvent = (event: FinvuEvent) => {
    if (!Finvu.FinvuEventType) return;

    switch (event.eventName) {
      case Finvu.FinvuEventType.LOGIN_OTP_VERIFIED:
        console.log('✅ User logged in successfully');
        break;

      case Finvu.FinvuEventType.CONSENT_APPROVED:
        console.log('✅ Consent approved');
        break;

      case Finvu.FinvuEventType.LINKING_SUCCESS:
        const accountCount = event.params.count as number;
        console.log(`✅ ${accountCount} account(s) linked`);
        break;

      case Finvu.FinvuEventType.WEBSOCKET_CONNECTED:
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        setStatusMessage('Connected successfully');
        break;

      case Finvu.FinvuEventType.WEBSOCKET_DISCONNECTED:
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        setStatusMessage('Disconnected');
        break;

      case Finvu.FinvuEventType.SESSION_ERROR:
        const error = event.params.error as string;
        console.error('❌ Session error:', error);
        break;

      // Handle connection status changes
      case 'CONNECTION_STATUS_CHANGED':
      case 'connection_status_changed':
        const status = event.params.status as string;
        setStatusMessage(`Connection status: ${status}`);
        setIsConnected(status === 'Connected successfully' || status === 'connected');
        break;

      // Handle OTP received
      case 'LOGIN_OTP_RECEIVED':
      case 'login_otp_received':
        console.log('Login OTP received event:', event.params);
        // You can use this event to automatically fill in the OTP if it's delivered to the app
        break;
    }
  };

  // Helper function to track custom events
  const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
    if (Finvu.track) {
      Finvu.track(eventName, params || {});
    }
  };

  // Initialize SDK
  const handleInitPress = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Initializing...');
      
      // Ensure event tracking is enabled before initialization
      if (Finvu.setEventsEnabled) {
        const enableResult = Finvu.setEventsEnabled(true);
        if (enableResult?.isSuccess) {
          console.log('✅ Event tracking enabled (before init)');
        }
      }
      
      const result = await Finvu.initializeWith(config);

      if (result.isSuccess) {
        setStatusMessage(`Initialized: ${result.data}`);
        
        // Re-enable event tracking after initialization to ensure it's active
        if (Finvu.setEventsEnabled) {
          const enableResult = Finvu.setEventsEnabled(true);
          if (enableResult?.isSuccess) {
            console.log('✅ Event tracking enabled (after init)');
          }
        }
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
        const { reference, authType, snaToken } = result.data;

        if (reference) {
          setOtpReference(reference);

          // Check if it's SNA authentication with token
          if (authType === 'SNA' && snaToken && snaToken.trim() !== '') {
            console.log('SNA Authentication successful, auto-verifying with token');
            setStatusMessage('SNA Authentication - Auto-verifying...');

            // Auto-verify with SNA token
            setOtp(snaToken);

            // Automatically verify the SNA token
            const verifyResult = await Finvu.verifyLoginOtp(snaToken, reference);

            if (verifyResult.isSuccess) {
              if (verifyResult.data.userId) {
                setUserId(verifyResult.data.userId);
                setIsLoggedIn(true);
                setStatusMessage(`SNA Authentication successful. User ID: ${verifyResult.data.userId}`);

                // After successful login, fetch user's consent details
                await fetchConsentDetails();

                // Also fetch linked accounts
                await fetchLinkedAccounts();
              }
            } else {
              setStatusMessage(`SNA verification failed: ${verifyResult.error.message}`);
              Alert.alert("SNA Verification Failed", verifyResult.error.message);
            }
          } else {
            // Regular OTP mode
            if(authType == "SNA"){
              const retryResult = await Finvu.loginWithUsernameOrMobileNumber(
                userHandle,
                mobileNumber,
                consentHandleId,
              );

              if (retryResult.isSuccess && retryResult.data.reference) {
                setOtpReference(retryResult.data.reference);
                setStatusMessage(`Login retry successful. OTP sent. Reference: ${retryResult.data.reference}`);
              } else {
                setStatusMessage(`Login retry failed: ${retryResult?.error?.message || 'Unknown error'}`);
                Alert.alert("Login Failed", retryResult.error?.message || 'Login retry failed');
              }
            }
            console.log('OTP mode - showing OTP field');
            setStatusMessage(`Login initiated. OTP sent. Reference: ${reference}`);
          }
        }
      } else {
        // Check for error code 1002 (SNA auth failed) and retry once
        if (result.error.code === 'AUTH_LOGIN_FAILED' || result.error.code === '1002') {
          console.log('SNA failed, retrying login once...');
          setStatusMessage('SNA authentication failed, retrying with OTP...');

          {// Retry the login
            const retryResult = await Finvu.loginWithUsernameOrMobileNumber(
              userHandle,
              mobileNumber,
              consentHandleId,
            );

            if (retryResult.isSuccess && retryResult.data.reference) {
              setOtpReference(retryResult.data.reference);
              setStatusMessage(`Login retry successful. OTP sent. Reference: ${retryResult.data.reference}`);
            } else {
              setStatusMessage(`Login retry failed: ${retryResult?.error?.message || 'Unknown error'}`);
              Alert.alert("Login Failed", retryResult.error?.message || 'Login retry failed');
            }
          }
        } else {
          setStatusMessage(`Login failed: ${result.error.message}`);
          Alert.alert("Login Failed", result.error.message);
        }
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

      const isConnectedResult = await Finvu.isConnected();
      const hasSessionResult = await Finvu.hasSession();
      console.log('new method result', 'isConnnected : ', isConnectedResult, 'hasSession : ', hasSessionResult)
      setStatusMessage('Verifying OTP...');
      try {
        await Finvu.connect();
      } catch (error) {
        console.error('Connection error:', error);
        setStatusMessage(`Connection failed: ${error}`);
        Alert.alert('Connection Error', String(error));
      }
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
      setTimeout(() => handleLogout(), 2000)
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
      setTimeout(() => handleLogout(), 2000)
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

      <EventsDisplay 
        events={events} 
        onClear={() => setEvents([])} 
      />

      <Text style={styles.note}>Check the console for detailed results</Text>
    </ScrollView>
  );
};



export default Home;