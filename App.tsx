import React, { useState } from 'react';
import { View, StyleSheet, Button, TextInput, Text } from 'react-native';
import * as Finvu from 'finvu'; // Adjust the import path if needed


export interface FinvuConfig {
  finvuEndpoint: string;
  certificatePins?: string[];
}

const App = () => {
  const [otp, setOtp] = useState('');
  const [otpReference, setOtpReference] = useState('');

  const config: FinvuConfig = {
    finvuEndpoint: 'wss://webvwdev.finvu.in/consentapi',
    certificatePins: [
    ],
  };
  
  const handleInitPress = async () => {
    try {
      console.log('Config: ' + config.finvuEndpoint);
      await Finvu.initializeWith(config);
    } catch (error) {
      console.error('Initialization Error:', error);
    }
  };

  const handleConnectPress = async () => {
    try {
      const result = await Finvu.connect();
      console.log("Result is: " + result);
    } catch (error) {
      console.error('Connect Error:', error);
    }
  };

  const handleLoginPress = async () => {
    try {
      const result = await Finvu.loginWithUsernameOrMobileNumber(
        "user_handle",
        "mobile_number",
        "consent_handle",
      );
      setOtpReference(result.reference);
      console.log("Result is: " + result.reference);
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const result = await Finvu.verifyLoginOtp(otp, otpReference);
      console.log("Result is: " + result.userId);
    } catch (error) {
      console.error('Verify OTP Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Init" onPress={handleInitPress} />
      <View style={styles.buttonMargin} />
      <Button title="Connect" onPress={handleConnectPress} />
      <View style={styles.buttonMargin} />
      <Button title="Login Init" onPress={handleLoginPress} />
      <View style={styles.buttonMargin} />
      <Button title="Verify Otp" onPress={handleVerifyOtp} />
      <View style={styles.buttonMargin} />
      <TextInput
        style={styles.input}
        value={otp}
        onChangeText={setOtp}
        placeholder="Enter OTP"
      />
      <View style={styles.buttonMargin} />
      <Text>Check the console for results!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMargin: {
    marginVertical: 10, // Adjust margin as needed
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 12,
    paddingLeft: 8,
    width: '80%',
  },
});

export default App;