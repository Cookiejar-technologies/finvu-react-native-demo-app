// components/CommonDialog.tsx
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
} from 'react-native';
import { styles as sharedStyles } from '../../styles/sharedStyles'; // Adjust this import

export interface CommonDialogProps {
    visible: boolean;
    title: string;
    onClose: () => void;
    onSubmit: () => void;
    children: React.ReactNode;
}

const CommonDialog: React.FC<CommonDialogProps> = ({
    visible,
    title,
    onClose,
    onSubmit,
    children,
}) => {
    return (
        <Modal transparent visible={visible} animationType="fade">
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={dialogStyles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={dialogStyles.dialogBox}>
                            <Text style={sharedStyles.title}>{title}</Text>
                            {children}
                            <View style={dialogStyles.actions}>
                                <TouchableOpacity onPress={onClose} style={dialogStyles.button}>
                                    <Text>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={onSubmit} style={dialogStyles.button}>
                                    <Text>Submit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default CommonDialog;

const dialogStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    dialogBox: {
        width: '85%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    actions: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        marginLeft: 12,
    },
});
