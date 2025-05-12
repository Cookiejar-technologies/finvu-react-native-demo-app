import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, TextInput, Text, Alert, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import * as Finvu from 'finvu'; // Adjust the import path if needed

export interface FinvuConfig {
  finvuEndpoint: string;
  certificatePins?: string[];
}

const App = () => {
  // Basic state management
  const [otp, setOtp] = useState('');
  const [otpReference, setOtpReference] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ready to initialize');
  const [isLoading, setIsLoading] = useState(false);

  // Account linking states
  const [fipsList, setFipsList] = useState<any[]>([]);
  const [selectedFip, setSelectedFip] = useState<string>('');
  const [discoveredAccounts, setDiscoveredAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<any[]>([]);
  const [linkingReference, setLinkingReference] = useState('');
  const [linkingOtp, setLinkingOtp] = useState('');

  // Consent management states
  const [consentHandleId, setConsentHandleId] = useState('consent_handle_id_generated'); // Example consent handle ID
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

  // Login with username or mobile
  const handleLoginPress = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Logging in...');
      const result = await Finvu.loginWithUsernameOrMobileNumber(
        "username",
        "mobile_number",
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
          setIsLoggedIn((_loginState) => true);
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

  // Fetch all available FIPs
  const getFipsList = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Fetching FIPs list...');
      const result = await Finvu.fipsAllFIPOptions();

      if (result.isSuccess) {
        const fips = result.data.searchOptions || [];
        setFipsList(fips);
        setStatusMessage(`Found ${fips.length} FIPs`);

        // Display some FIP info
        if (fips.length > 0) {
          const sampleFips = fips.slice(0, 3);
          const fipNames = sampleFips.map(fip => fip.productName || fip.fipId).join(", ");
          Alert.alert(
            "FIPs Available",
            `Found ${fips.length} FIPs. Some examples: ${fipNames}...`
          );
        }
      } else {
        setStatusMessage(`Fetch FIPs failed: ${result.error.message}`);
        Alert.alert("Fetch FIPs Failed", result.error.message);
      }
    } catch (error) {
      console.error('Fetch FIPs error:', error);
      setStatusMessage(`Fetch FIPs failed: ${error}`);
      Alert.alert('Fetch FIPs Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Discover accounts at a specific FIP
  const discoverAccounts = async (fipId: string) => {
    if (!isLoggedIn) {
      Alert.alert("Not Logged In", "Please log in first");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage(`Discovering accounts at ${fipId}...`);
      const identifiers = [
        { category: "STRONG", type: "MOBILE", value: "8459177562" },
      ];

      const result = await Finvu.discoverAccounts(fipId, ["DEPOSIT"], identifiers);

      if (result.isSuccess) {
        const accounts = result.data.discoveredAccounts || [];
        setDiscoveredAccounts(accounts);
        setSelectedFip(fipId);
        setStatusMessage(`Found ${accounts.length} accounts at ${fipId}`);

        if (accounts.length > 0) {
          Alert.alert(
            "Accounts Discovered",
            `Found ${accounts.length} accounts. Would you like to link them?`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Link Accounts", onPress: () => linkDiscoveredAccounts(fipId, accounts) }
            ]
          );
        } else {
          Alert.alert("No Accounts", "No accounts were discovered with the provided identifiers.");
        }
      } else {
        setStatusMessage(`Discovery failed: ${result.error.message}`);
        Alert.alert("Discovery Failed", result.error.message);
      }
    } catch (error) {
      console.error('Discover accounts error:', error);
      setStatusMessage(`Discovery failed: ${error}`);
      Alert.alert('Discovery Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Link discovered accounts
  const linkDiscoveredAccounts = async (fipId: string, accounts: any[]) => {
    try {
      setIsLoading(true);
      setStatusMessage('Fetching FIP details for linking...');

      const fipDetailsResult = await Finvu.fetchFipDetails(fipId);

      if (!fipDetailsResult.isSuccess) {
        setStatusMessage(`FIP fetch failed: ${fipDetailsResult.error.message}`);
        Alert.alert("FIP Fetch Failed", fipDetailsResult.error.message);
        return;
      }

      setStatusMessage('Linking accounts...');

      const linkingResult = await Finvu.linkAccounts(
        accounts,
        fipDetailsResult.data
      );

      if (linkingResult.isSuccess) {
        if (linkingResult.data.referenceNumber) {
          setLinkingReference(linkingResult.data.referenceNumber);
          setStatusMessage(`Account linking initiated. Reference: ${linkingResult.data.referenceNumber}`);

          Alert.alert(
            "OTP Required",
            "Please enter the OTP sent to your registered mobile number to complete account linking.",
            [{ text: "OK" }]
          );
        } else if (linkingResult.data.linkedAccounts) {
          setLinkedAccounts(linkingResult.data.linkedAccounts);
          setStatusMessage(`Accounts linked: ${linkingResult.data.linkedAccounts.length} accounts`);
        } else {
          setStatusMessage('Accounts linked successfully');
        }
      } else {
        setStatusMessage(`Linking failed: ${linkingResult.error.message}`);
        Alert.alert("Linking Failed", linkingResult.error.message);
      }
    } catch (error) {
      console.error('Link accounts error:', error);
      setStatusMessage(`Linking failed: ${error}`);
      Alert.alert('Linking Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm account linking with OTP
  const confirmAccountLinking = async () => {
    if (!linkingOtp) {
      Alert.alert("Missing OTP", "Please enter the OTP you received for account linking");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage('Confirming account linking...');

      const result = await Finvu.confirmAccountLinking(linkingReference, linkingOtp);

      if (result.isSuccess) {
        setStatusMessage('Account linking confirmed successfully');
        setLinkingReference('');
        setLinkingOtp('');

        // Refresh linked accounts after successful linking
        await fetchLinkedAccounts();
      } else {
        setStatusMessage(`Linking confirmation failed: ${result.error.message}`);
        Alert.alert("Linking Confirmation Failed", result.error.message);
      }
    } catch (error) {
      console.error('Confirm account linking error:', error);
      setStatusMessage(`Linking confirmation failed: ${error}`);
      Alert.alert('Linking Confirmation Error', String(error));
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
      const accountsToSend = linkedAccounts.length > 0 ? linkedAccounts : selectedAccounts;
      
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
        setLinkingOtp('');
        setLinkingReference('');
        setDiscoveredAccounts([]);
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
            <Text style={styles.sectionTitle}>Financial Institutions</Text>
            <Button
              title="Get All FIPs"
              onPress={getFipsList}
              disabled={isLoading}
            />
            <View style={styles.buttonMargin} />

            {fipsList.length > 0 && (
              <>
                <Text style={styles.infoText}>
                  Select a FIP to discover accounts:
                </Text>
                <View style={styles.buttonMargin} />

                <ScrollView style={styles.fipList} nestedScrollEnabled={true}>
                  {fipsList.slice(0, 5).map((fip, index) => (
                    <Button
                      key={index}
                      title={fip.productName || fip.fipId}
                      onPress={() => discoverAccounts(fip.fipId)}
                      disabled={isLoading}
                    />
                  ))}
                </ScrollView>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Management</Text>
            <Button
              title="Fetch Linked Accounts"
              onPress={fetchLinkedAccounts}
              disabled={isLoading}
            />

            {linkingReference && (
              <>
                <View style={styles.buttonMargin} />
                <Text style={styles.infoText}>
                  Enter OTP to confirm account linking:
                </Text>
                <TextInput
                  style={styles.input}
                  value={linkingOtp}
                  onChangeText={setLinkingOtp}
                  placeholder="Enter Linking OTP"
                  keyboardType="number-pad"
                  editable={!isLoading}
                />
                <Button
                  title="Confirm Account Linking"
                  onPress={confirmAccountLinking}
                  disabled={!linkingOtp || isLoading}
                />
              </>
            )}

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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20, 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  section: {
    width: '100%',
    marginVertical: 10,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonMargin: {
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonSpacer: {
    width: 10,
  },
  input: {
    height: 45,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 12,
    paddingHorizontal: 12,
    width: '100%',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  status: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
    padding: 8,
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    color: '#888',
  },
  loadingContainer: {
    marginVertical: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  fipList: {
    maxHeight: 200,
    width: '100%',
  },
});

export default App;