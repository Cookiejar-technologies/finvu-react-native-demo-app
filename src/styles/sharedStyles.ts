import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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