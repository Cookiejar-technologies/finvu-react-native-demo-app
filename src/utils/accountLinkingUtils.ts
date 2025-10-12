import * as Finvu from '@cookiejar-technologies/finvu-react-native-sdk';
import { FipDetails } from "finvu";
import { Identifier, InputDialogResolver } from "../types/accountLinkingTypes";
import { Alert } from 'react-native';

export class AccountLinking {
    static getRequiredFinvuTypeIdentifierInfoList(
        fipDetails: FipDetails | null | undefined
    ): Identifier[] {
        if (!fipDetails?.typeIdentifiers) return [];

        const allIdentifiers: Identifier[] = fipDetails.typeIdentifiers.flatMap((typeIdentifier) =>
            typeIdentifier.identifiers.map(
                (identifier) =>
                    new Identifier({
                        fiType: typeIdentifier.fiType,
                        type: identifier.type,
                        category: identifier.category,
                    })
            )
        );

        // Remove duplicates based on `type`
        const seenTypes = new Set<string>();
        const distinctIdentifiers = allIdentifiers.filter((identifier) => {
            if (seenTypes.has(identifier.type)) return false;
            seenTypes.add(identifier.type);
            return true;
        });

        return distinctIdentifiers;
    }

    /**
    * Prompts the user to provide missing PAN and DOB values and returns identifiers with values.
    * @param rawIdentifiers List of required identifiers (some may not have values)
    * @param mobileNumber Fallback mobile number for MOBILE type
    */
    static getIdentifiersWithUserInput = async (
        fipDetails: Finvu.FipDetails,
        mobileNumber: string,
        showPanInputDialog: (onSubmit: InputDialogResolver) => void,
        showDobInputDialog: (onSubmit: InputDialogResolver) => void
    ): Promise<Identifier[]> => {
        const requiredIdentifiers = AccountLinking.getRequiredFinvuTypeIdentifierInfoList(fipDetails);

        console.log('required identifires', requiredIdentifiers)

        const resolvedIdentifiers: Identifier[] = [];

        for (const identifier of requiredIdentifiers) {
            const { fiType, type, category } = identifier;
            let value: string | undefined;
            if (type === 'MOBILE') {
                value = mobileNumber
            } else if (type === 'PAN') {
                const pan = await new Promise<string>((resolve) => {
                    showPanInputDialog(resolve);
                });
                value = pan
            } else if (type === 'DOB') {
                const dob = await new Promise<string>((resolve) => {
                    showDobInputDialog(resolve);
                });
                value = dob
            } else {
                // Optionally handle more types or skip
                Alert.alert('Unsupported Identifier', `Type ${type} is not supported.`);
            }
            resolvedIdentifiers.push(new Identifier({ fiType, type, category, value, }));
        }
        return resolvedIdentifiers;
    };
}
