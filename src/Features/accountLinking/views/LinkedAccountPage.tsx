import * as Finvu from '@cookiejar-technologies/finvu-react-native-sdk';
import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinkedAccountDetails } from '@cookiejar-technologies/finvu-react-native-sdk';
import { ROUTES } from '../../../constants/routes';
import { LinkedAccountsPageNavigationProp } from '../../../types/navigation';
import { styles } from '../../../styles/sharedStyles';


const LinkedAccountsPage = () => {
    const navigation = useNavigation<LinkedAccountsPageNavigationProp>();
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        fetchLinkedAccounts();
    }, []);

    const fetchLinkedAccounts = async () => {
        try {
            setIsLoading(true);
            setStatusMessage('Fetching linked accounts...');
            const result = await Finvu.fetchLinkedAccounts();

            if (result.isSuccess) {
                const accounts = result.data.linkedAccounts || [];
                setLinkedAccounts(accounts);
                setStatusMessage(`Found ${accounts.length} linked accounts`);
                console.log('Linked Accounts:', accounts);
            } else {
                setStatusMessage(`Fetch failed: ${result.error.message}`);
                Alert.alert('Fetch Failed', result.error.message);
            }
        } catch (error) {
            console.error('Fetch linked accounts error:', error);
            setStatusMessage(`Fetch failed: ${error}`);
            Alert.alert('Fetch Error', String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const renderAccountItem = ({ item }: { item: LinkedAccountDetails }) => (
        <View style={styles.section}>
            <Text style={styles.infoText}>Bank: {item.fipName}</Text>
            <Text style={styles.infoText}>LinkedAccountDetails Number: {item.maskedAccountNumber}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Linked Accounts</Text>
            <Text style={styles.status}>{statusMessage}</Text>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <>
                    <FlatList
                        data={linkedAccounts}
                        keyExtractor={(item) => item.maskedAccountNumber}
                        renderItem={renderAccountItem}
                        style={styles.fipList}
                    />

                    <View style={styles.buttonMargin}>
                        <Button
                            title="Discover New Accounts"
                            onPress={() => navigation.navigate(ROUTES.DISCOVER_ACCOUNTS, { linkedAccounts: linkedAccounts, })}
                        />
                    </View>
                </>
            )}
        </View>
    );
};

export default LinkedAccountsPage;
