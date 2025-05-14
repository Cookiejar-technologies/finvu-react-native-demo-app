// components/PanInputDialog.tsx
import React, { useState } from 'react';
import { TextInput, Text } from 'react-native';
import CommonDialog from '../../../components/finvuDialog/FinvuDialog';
import { styles } from '../../../styles/sharedStyles';


export interface PanInputDialogProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (pan: string) => void;
}

const PanInputDialog: React.FC<PanInputDialogProps> = ({ visible, onClose, onSubmit }) => {
    const [pan, setPan] = useState('');
    const [error, setError] = useState('');

    const validate = () => {
        const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!regex.test(pan)) {
            setError('Invalid PAN format');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(pan);
            onClose();
        }
    };

    return (
        <CommonDialog visible={visible} title="Enter PAN Number" onClose={onClose} onSubmit={handleSubmit}>
            <TextInput
                style={styles.input}
                placeholder="ABCDE1234F"
                value={pan}
                onChangeText={(text) => setPan(text.toUpperCase())}
                autoCapitalize="characters"
            />
            {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
        </CommonDialog>
    );
};

export default PanInputDialog;
