import { JSONSchema7 } from 'json-schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Constructor<T = any> extends Function {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (...args: any[]): T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface JSONSchema<Type = any> extends JSONSchema7 {
    properties?: {
        [k in keyof Type]: JSONSchema<Type[k]>;
    };
}
