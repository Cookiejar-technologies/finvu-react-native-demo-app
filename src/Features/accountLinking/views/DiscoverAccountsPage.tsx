import * as Finvu from 'finvu';
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Alert,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DiscoverAccountsPageNavigationProp, DiscoverAccountsPageRouteProp } from '../../../types/navigation';
import { ROUTES } from '../../../constants/routes';
import { styles } from '../../../styles/sharedStyles';
import { AccountLinking } from '../../../utils/accountLinkingUtils';
import { useFinvu } from '../../../context/FinvuContext';
import { InputDialogResolver } from '../../../types/accountLinkingTypes';
import PanInputDialog from '../components/PanInputDialog';
import DobInputDialog from '../components/DobInputDialog';

const DiscoverAccountsPage = () => {
    const navigation = useNavigation<DiscoverAccountsPageNavigationProp>();
    const route = useRoute<DiscoverAccountsPageRouteProp>();

    const [fipsList, setFipsList] = useState<Finvu.FIPInfo[]>([]);
    const [filteredFips, setFilteredFips] = useState<Finvu.FIPInfo[]>([]);
    const [searchText, setSearchText] = useState('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [showPanDialog, setShowPanDialog] = useState<boolean>(false);
    const [showDobDialog, setShowDobDialog] = useState<boolean>(false);
    const linkedAccounts = route.params?.linkedAccounts || [];
    const isLoggedIn = true; // Replace with real logic
    const { mobileNumber } = useFinvu();

    const panResolver = useRef<InputDialogResolver>(null);
    const dobResolver = useRef<InputDialogResolver>(null);

    useEffect(() => {
        getFipsList();
    }, []);

    useEffect(() => {
        const filteredFIPs = fipsList.filter((fip) =>
            fip.productName?.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredFips(filteredFIPs);
    }, [searchText, fipsList]);

    const toggleShowPanDialog = () => {
        setShowPanDialog(prevState => !prevState)
    }

    const toggleShowDobDialog = () => {
        setShowDobDialog(prevState => !prevState)
    }

    const showPanInputDialog = (onSubmit: InputDialogResolver) => {
        panResolver.current = onSubmit;
        toggleShowPanDialog();
    };

    const showDobInputDialog = (onSubmit: InputDialogResolver) => {
        dobResolver.current = onSubmit;
        toggleShowDobDialog();
    };

    const getFipsList = async () => {
        try {
            setIsLoading(true);
            setStatusMessage('Fetching FIPs list...');
            const result = await Finvu.fipsAllFIPOptions();

            if (result.isSuccess) {
                const fips = result.data.searchOptions || [];
                setFipsList(fips);
                setFilteredFips(fips);
                setStatusMessage(`Found ${fips.length} FIPs`);

                if (fips.length > 0) {
                    const sample = fips.slice(0, 3).map(f => f.productName || f.fipId).join(', ');
                    Alert.alert('FIPs Available', `Found ${fips.length}. Examples: ${sample}...`);
                }
            } else {
                Alert.alert('Fetch FIPs Failed', result.error.message);
            }
        } catch (error) {
            Alert.alert('Fetch Error', String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const discoverAccounts = async (fipInfo: Finvu.FIPInfo) => {
        if (!isLoggedIn) {
            Alert.alert("Not Logged In", "Please log in first");
            return;
        }

        try {
            const { fipId, fipFiTypes, productName } = fipInfo;
            const fipDetailsResult = await Finvu.fetchFipDetails(fipId);

            if (fipDetailsResult.isSuccess) {
                const requiredIdentifers = await AccountLinking.getIdentifiersWithUserInput(
                    fipDetailsResult.data,
                    mobileNumber,
                    showPanInputDialog,
                    showDobInputDialog
                )
                const identifiers = requiredIdentifers.map((id) => ({
                    category: id.category,
                    type: id.type,
                    value: id.type === 'MOBILE' ? mobileNumber : id?.value ?? '',
                }));

                setIsLoading(true);
                setStatusMessage(`Discovering accounts at ${fipId}...`);

                console.log('disvoer params', fipId, fipFiTypes, identifiers)

                const result = await Finvu.discoverAccounts(fipId, fipFiTypes, identifiers);

                if (result.isSuccess) {
                    const accounts = result.data.discoveredAccounts || [];

                    // filter out linked accounts.
                    const unlinkedAccounts = accounts.filter(
                        account =>
                            linkedAccounts.findIndex(
                                linkedAccount => linkedAccount.maskedAccountNumber === account.maskedAccountNumber
                            ) === -1
                    );

                    if (accounts.length > 0) {
                        Alert.alert(
                            "Accounts Discovered",
                            `Found ${accounts.length} accounts. Link them?`,
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Link Accounts",
                                    onPress: () =>
                                        navigation.navigate(ROUTES.DISCOVERED_ACCOUNTS, {
                                            fipId,
                                            productName: productName ?? '',
                                            discoveredAccounts: unlinkedAccounts,
                                        }),
                                },
                            ]
                        );
                    } else {
                        Alert.alert("No Accounts", "No accounts discovered with provided identifiers.");
                    }
                } else {
                    Alert.alert("Discovery Failed", result.error.message);
                }
            } else {
                Alert.alert("FIP Details Error", fipDetailsResult.error.message);
            }
        } catch (error) {
            Alert.alert("Discovery Error", String(error));
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <PanInputDialog
                visible={showPanDialog}
                onClose={() => toggleShowPanDialog()}
                onSubmit={(value) => panResolver.current?.(value)}
            />

            <DobInputDialog
                visible={showDobDialog}
                onClose={() => toggleShowDobDialog()}
                onSubmit={(value) => dobResolver.current?.(value)}
            />

            <View style={styles.container}>
                <Text style={styles.title}>Discover Accounts</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Search FIP by name..."
                    value={searchText}
                    onChangeText={setSearchText}
                />

                <Text style={styles.status}>{statusMessage}</Text>

                {isLoading ? (
                    <ActivityIndicator size="large" style={styles.loadingContainer} />
                ) : (
                    <FlatList
                        data={filteredFips}
                        keyExtractor={(item) => item.fipId}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.section}
                                onPress={() => discoverAccounts(item)}
                            >
                                <Text style={styles.sectionTitle}>{item.productName || item.fipId}</Text>
                                <Text style={styles.infoText}>
                                    {item.productDesc || 'No description available.'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </>
    );
};

export default DiscoverAccountsPage;