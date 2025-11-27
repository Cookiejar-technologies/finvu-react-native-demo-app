import React, { useEffect, useRef, useState } from 'react';
import * as Finvu from '@cookiejar-technologies/finvu-react-native-sdk-test';
import { View, Text, FlatList, TouchableOpacity, Button, Alert } from 'react-native';
import { styles } from '../../../styles/sharedStyles';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { DiscoverAccountsPageNavigationProp, DiscoveredAccountsPageRouteProp } from '../../../types/navigation';
import { InputDialogResolver } from '../../../types/accountLinkingTypes';
import OtpInputDialog from '../components/OtpInputDialog';
import { ROUTES } from '../../../constants/routes';
import { useFinvu } from '../../../context/FinvuContext';


const DiscoveredAccountsPage: React.FC = () => {
    const route = useRoute<DiscoveredAccountsPageRouteProp>();
    const navigation = useNavigation<DiscoverAccountsPageNavigationProp>();
    const { fipId, productName, discoveredAccounts } = route.params;

    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [linkingReference, setLinkingReference] = useState('');
    const [showOtpDialog, setShowOtpInputDialog] = useState<boolean>(false)
    const otpResolver = useRef<InputDialogResolver>(null);
    const { consentHandleId, mobileNumber, userHandle } = useFinvu();

    useEffect(() => {
        if (linkingReference) {
            showOtpInputDialog(handleOtpSubmit);
        }
    }, [linkingReference]);


    const toggleShowOtpDialog = () => {
        setShowOtpInputDialog(prevState => !prevState)
    }

    const showOtpInputDialog = (onSubmit: InputDialogResolver) => {
        otpResolver.current = onSubmit;
        toggleShowOtpDialog();
    };



    const toggleAccountSelection = (maskedAccountNumber: string) => {
        setSelectedAccounts(prev =>
            prev.includes(maskedAccountNumber)
                ? prev.filter(num => num !== maskedAccountNumber)
                : [...prev, maskedAccountNumber]
        );
    };

    const handleLinkAccounts = async () => {
        const accountsToLink = discoveredAccounts.filter(account =>
            selectedAccounts.includes(account.maskedAccountNumber)
        );

        try {
            setIsLoading(true);
            setStatusMessage('Fetching FIP details for linking...');

            const fipDetailsResult = await Finvu.fetchFipDetails(fipId);
            if (!fipDetailsResult.isSuccess) {
                const { code, message } = fipDetailsResult.error;
                console.error('FIP Fetch failed:', { code, message });
                setStatusMessage(`FIP Fetch failed: ${message}`);
                
                // Handle FIP details error codes
                if (code === 'F404') {
                    Alert.alert("FIP Not Found", "The financial institution details were not found.");
                } else if (code === 'F406') {
                    Alert.alert("Invalid FIP", "The financial institution is invalid.");
                } else {
                    Alert.alert("FIP Fetch Failed", message);
                }
                return;
            }

            setStatusMessage('Linking accounts...');
            const linkingResult = await Finvu.linkAccounts(accountsToLink, fipDetailsResult.data);

            if (!linkingResult.isSuccess) {
                const { code, message } = linkingResult.error;
                console.error('Linking failed:', { code, message });
                setStatusMessage(`Linking failed: ${message}`);
                
                // Handle linking error codes
                if (code === 'D009') {
                    Alert.alert("Already Linked", "One or more accounts are already linked.");
                } else if (code === 'D007') {
                    Alert.alert("Invalid FIP", "The financial institution is invalid.");
                } else if (code === 'D008') {
                    Alert.alert("FIP Operation Failed", "The financial institution operation failed.");
                } else if (code === 'D003') {
                    Alert.alert("Authentication Required", "Device authentication is required.");
                } else {
                    Alert.alert("Linking Failed", message);
                }
                return;
            }

            const reference = linkingResult.data.referenceNumber;
            if (reference) {
                setLinkingReference(reference); // This will trigger useEffect
                setStatusMessage(`Account linking initiated. Reference: ${reference}`);
            } else {
                setStatusMessage('Accounts linked successfully');
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
    const handleOtpSubmit = async (otp: string) => {
        if (!linkingReference) return;

        try {
            setIsLoading(true);
            setStatusMessage('Confirming account linking...');

            const connectedResult  = await Finvu.isConnected();
            const hasSession = await Finvu.hasSession();
            console.log('isConnected:', connectedResult, 'hasSession:', hasSession);

            const result = await Finvu.confirmAccountLinking(linkingReference, otp);

            if (result.isSuccess) {
                setStatusMessage('Account linking confirmed successfully');
                setLinkingReference('');
                navigation.goBack();
            } else {
                const { code, message } = result.error;
                console.error('Linking confirmation failed:', { code, message });
                setStatusMessage(`Linking confirmation failed: ${message}`);
                
                // Handle confirmation error codes
                if (code === 'A005') {
                    Alert.alert("Invalid OTP", "The OTP you entered is incorrect. Please try again.");
                } else if (code === 'A006') {
                    Alert.alert("Invalid Reference", "The linking reference is invalid. Please start over.");
                } else if (code === 'D009') {
                    Alert.alert("Already Linked", "This account is already linked.");
                } else if (code === 'D008') {
                    Alert.alert("FIP Operation Failed", "The financial institution operation failed.");
                } else {
                    Alert.alert("Linking Confirmation Failed", message);
                }
            }
        } catch (error) {
            console.error('Confirm account linking error:', error);
            setStatusMessage(`Linking confirmation failed: ${error}`);
            Alert.alert('Linking Confirmation Error', String(error));
        } finally {
            setIsLoading(false);
            setLinkingReference('')

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: ROUTES.HOME }],
                })
            );
        }
    };


    const renderAccount = ({ item }: { item: Finvu.DiscoveredAccount }) => {
        const isSelected = selectedAccounts.includes(item.maskedAccountNumber);
        return (
            <TouchableOpacity
                style={[
                    styles.section,
                    { borderColor: isSelected ? 'green' : 'transparent', borderWidth: 2 },
                ]}
                onPress={() => toggleAccountSelection(item.maskedAccountNumber)}
            >
                <Text style={styles.sectionTitle}>{productName}</Text>
                <Text style={styles.infoText}>{item.maskedAccountNumber}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <OtpInputDialog visible={showOtpDialog} onClose={() => toggleShowOtpDialog()} onSubmit={(value) => otpResolver.current?.(value)} />
            <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
                <Text style={styles.title}>Select account to link</Text>
                <FlatList
                    data={discoveredAccounts}
                    renderItem={renderAccount}
                    keyExtractor={item => item.maskedAccountNumber}
                    style={styles.fipList}
                />
                <View style={styles.buttonMargin}>
                    <Button
                        title="Link Accounts"
                        onPress={handleLinkAccounts}
                        disabled={selectedAccounts.length === 0}
                    />
                </View>
            </View>
        </>
    );
};

export default DiscoveredAccountsPage;
