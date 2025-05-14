// components/DobInputDialog.tsx
import React, { useState } from 'react';
import { Text, Button, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CommonDialog from '../../../components/finvuDialog/FinvuDialog';


export interface DobInputDialogProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (dob: string) => void;
}

const DobInputDialog: React.FC<DobInputDialogProps> = ({ visible, onClose, onSubmit }) => {
    const [dob, setDob] = useState(new Date());
    const [error, setError] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    const validate = () => {
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const is18 =
            age > 18 ||
            (age === 18 &&
                (today.getMonth() > dob.getMonth() ||
                    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())));

        if (!is18) {
            setError('You must be at least 18 years old');
            return false;
        }

        setError('');
        return true;
    };

    const handleSubmit = () => {
        if (validate()) {
            const formatted = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(
                dob.getDate()
            ).padStart(2, '0')}`;
            onSubmit(formatted);
            onClose();
        }
    };

    return (
        <CommonDialog visible={visible} title="Select Date of Birth" onClose={onClose} onSubmit={handleSubmit}>
            <Button title="Pick Date" onPress={() => setShowPicker(true)} />
            <Text style={{ marginTop: 10, textAlign: 'center' }}>
                Selected: {dob.toDateString()}
            </Text>
            {showPicker && (
                <DateTimePicker
                    value={dob}
                    mode="date"
                    maximumDate={new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowPicker(false);
                        if (selectedDate) setDob(selectedDate);
                    }}
                />
            )}
            {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}
        </CommonDialog>
    );
};

export default DobInputDialog;
