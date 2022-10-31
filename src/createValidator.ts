import { JSONSchema7 } from "json-schema";
import Ajv, { JSONSchemaType } from "ajv";

import { SchemaValidationError } from "./ValidationError";

export interface SchemaValidator {
    is: <Type>(schema: JSONSchema7, data: unknown) => data is Type;
    validate: (schema: JSONSchema7, data: unknown) => boolean;
}

export const createValidator = (): SchemaValidator => {
    const rootValidator = new Ajv();
    const validate = (schema: JSONSchema7, data: unknown): boolean => {
        const isValid = rootValidator.validate(schema, data);
        if (rootValidator.errors) {
            const { errors } = rootValidator;
            throw new SchemaValidationError(
                String(schema.$id || "schema without id"),
                rootValidator.errorsText(errors),
                data,
                errors,
            );
        }
        return isValid as boolean;
    };

    return {
        validate,
        compile: <T>(schema: JSONSchemaType<T>) => rootValidator.compileAsync(schema),
        is: <Type>(schema: JSONSchema7, data: unknown): data is Type => {
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
