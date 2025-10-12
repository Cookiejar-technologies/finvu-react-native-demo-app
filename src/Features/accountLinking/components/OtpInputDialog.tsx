// components/OtpInputDialog.tsx
import React, { useState } from 'react';
import { TextInput, Text } from 'react-native';
import CommonDialog from '../../../components/finvuDialog/FinvuDialog';
import { styles } from '../../../styles/sharedStyles';


export interface OtpInputDialogProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (otp: string) => void;
}

const OtpInputDialog: React.FC<OtpInputDialogProps> = ({ visible, onClose, onSubmit }) => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');

    const validate = () => {
        if (!/^\d{6,8}$/.test(otp)) {
            setError('OTP must be between 6 and 8 digits');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = () => {
        if (validate()) {
            console.log('otp', otp);
            onSubmit(otp);
            onClose();
        }
    };

    return (
        <CommonDialog visible={visible} title="Enter OTP" onClose={onClose} onSubmit={handleSubmit}>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={8}
                value={otp}
                onChangeText={setOtp}
                placeholder="123456"
            />
            {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
        </CommonDialog>
    );
};

export default OtpInputDialog;
