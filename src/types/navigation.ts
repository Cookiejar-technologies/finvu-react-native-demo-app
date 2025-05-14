import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Finvu from 'finvu-react-native-sdk';
import { ROUTES } from "../constants/routes";
import { LinkedAccountDetails } from 'finvu-react-native-sdk';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
    [ROUTES.HOME] : undefined;
    [ROUTES.LINKED_ACCOUNTS]: undefined;
    [ROUTES.DISCOVER_ACCOUNTS]: {
        linkedAccounts: LinkedAccountDetails[]
    };
    [ROUTES.DISCOVERED_ACCOUNTS]: {
        fipId: string,
        productName : string,
        discoveredAccounts: Finvu.DiscoveredAccount[]
    }
};

export type HomePageNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    typeof ROUTES.HOME
>;

export type LinkedAccountsPageNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    typeof ROUTES.LINKED_ACCOUNTS
>;

export type DiscoverAccountsPageNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    typeof ROUTES.DISCOVER_ACCOUNTS
>;

export type DiscoverAccountsPageRouteProp = RouteProp<
    RootStackParamList,
    typeof ROUTES.DISCOVER_ACCOUNTS
>;

export type DiscoveredAccountsPageNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    typeof ROUTES.DISCOVERED_ACCOUNTS
>;

export type DiscoveredAccountsPageRouteProp = RouteProp<
    RootStackParamList,
    typeof ROUTES.DISCOVERED_ACCOUNTS
>;