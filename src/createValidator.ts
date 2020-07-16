import Ajv from "ajv";

import { SchemaValidationError } from "./ValidationError";
import { JSONSchema, Constructor } from "./types";
import { compileSchema } from "./utils";

export interface SchemaValidator {
    compile: typeof compileSchema;
    is: <Type>(schema: JSONSchema<Type>, data: unknown) => data is Type;
    validate: <Type>(schema: JSONSchema<Type>, data: unknown) => boolean;
}

export const createValidator = (): SchemaValidator => {
    const rootValidator = new Ajv();
    const validate = <Type>(schema: JSONSchema<Type>, data: unknown): boolean => {
        const isValid = rootValidator.validate(schema, data);
        if (rootValidator.errors) {
            const { errors } = rootValidator;
            throw new SchemaValidationError(
                String(schema.$id || "schema without id"),
                rootValidator.errorsText(errors),
                data as Constructor,
                errors,
            );
        }
        return isValid as boolean;
    };

    return {
        validate,
        compile: compileSchema,
        is: <Type>(schema: JSONSchema<Type>, data: unknown): data is Type => {
            try {
                return validate(schema, data);
            } catch (e) {
                if (e instanceof SchemaValidationError) {
                    return false;
                }
                throw e;
            }
        },
    };
};
