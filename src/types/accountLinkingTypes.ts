interface IdentifierProps {
    fiType: string;
    type: string;
    category: string;
    value?: string;
}

class Identifier {
    readonly fiType: string;
    readonly type: string;
    readonly category: string;
    readonly value?: string;

    constructor({ fiType, type, category, value }: IdentifierProps) {
        this.fiType = fiType;
        this.type = type;
        this.category = category;
        this.value = value;
    }

    withValue(value: string): Identifier {
        return new Identifier({
            fiType: this.fiType,
            type: this.type,
            category: this.category,
            value,
        });
    }
}

export type InputDialogResolver = (value: string) => void;

export { Identifier, IdentifierProps }