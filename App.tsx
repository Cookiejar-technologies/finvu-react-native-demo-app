// App.tsx
import React from 'react';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './Home';
import { FinvuProvider } from './src/context/FinvuContext';
import { ROUTES } from './src/constants/routes';
import LinkedAccountsPage from './src/Features/accountLinking/views/LinkedAccountPage';
import DiscoverAccountsPage from './src/Features/accountLinking/views/DiscoverAccountsPage';
import DiscoveredAccountsPage from './src/Features/accountLinking/views/DiscoveredAccountsPage';
import { RootStackParamList } from './src/types/navigation';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <FinvuProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={ROUTES.HOME}>
          <Stack.Screen name={ROUTES.HOME} component={Home} />
          <Stack.Screen
            name={ROUTES.LINKED_ACCOUNTS}
            component={LinkedAccountsPage}
            options={{ title: 'Linked Accounts' }}
          />
          <Stack.Screen
            name={ROUTES.DISCOVER_ACCOUNTS}
            component={DiscoverAccountsPage}
            options={{ title: 'Discover Accounts' }}
          />
          <Stack.Screen
            name={ROUTES.DISCOVERED_ACCOUNTS}
            component={DiscoveredAccountsPage}
            options={{ title: 'Link Accounts' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </FinvuProvider>
  );
}
