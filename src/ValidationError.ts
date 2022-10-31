import { ErrorObject } from "ajv";
import { reduce, isPlainObject, isArray, uniq, get } from "lodash";

export interface FormattedAjvError {
    value: unknown;
    prop: string;
    errors: string[];
}

/**
 * This Error is thrown everytime, when
 * a given object does not match
 * the expected schema
 */
export class SchemaValidationError<EntityType = unknown> extends Error {
    // generic error for the validated entity, that is e.g. the case for compound schemas w/ anyOf
    private static ENTITY_ERROR = "validated-entity";

    public static KEYWORDS = {
        ADDITIONAL_PROPERTIES: "additionalProperties",
        ANY_OF: "anyOf",
        REQUIRED: "required",
        FORMAT: "format",
    };

    constructor(schema: string, message: string, private entity: EntityType, private errors: ErrorObject[]) {
        super(`Validation error ("${message}") in "${schema}"`);
        console.log(this.errors);
    }

    public get failedEntity(): EntityType {
        return this.entity;
    }

    public get schemaErrors(): ErrorObject[] {
        return this.errors;
    }

    /**
     * Gets a filtered list of errors by blacklisting some AJV-Keywords in errors.
     * This method can be helpful if AJV produces a lot of noise in compound schemas.
     *
     * @param keywordBlacklist A list of ajv-keywords to ignore, e.g. ignore all 'additionalProperties' errors
     */
    public getFilteredSchemaErrors(keywordBlacklist: string[] = []): ErrorObject[] {
        return this.errors.filter(error => !keywordBlacklist.includes(error.keyword));
    }

    /**
     * Gets formatted errors with their respective prop. This method tries to turn down
     * some noise, as AJV is very verbose when it comes to errors (e.g. additionalProperties are
     * repeated for every field)
     *
     * @param keywordBlacklist A list of json-schema-keywords to ignore, e.g. ignore all 'additionalProperties' errors
     */
    public getSchemaErrorsWithProps(keywordBlacklist: string[] = []): Record<string, FormattedAjvError> {
        return this.getFilteredSchemaErrors(keywordBlacklist)
            .map(error => {
                let dataPath;
                if (error.instancePath.length) {
                    // ajv outputs the dataPath with a leading '/' for objects, lodash does not expect this
                    dataPath = error.instancePath.startsWith("/")
                        ? error.instancePath.substring(1)
                        : error.instancePath;
                }
                const sanitizedPath = dataPath?.replace(/\//g, ".");
                return {
                    message: error.message,
                    value:
                        sanitizedPath && sanitizedPath.length
                            ? get(this.entity, sanitizedPath)
                            : this.guessEntityName(),
                    prop: sanitizedPath,
                };
            })
            .reduce((acc, { message, prop, value }) => {
                if (!prop) {
                    return acc;
                }
                return {
                    ...acc,
                    [prop]: {
                        prop,
                        value,
                        errors: uniq([...((acc[prop] && acc[prop].errors) || []), message]) as string[],
                    },
                };
            }, {} as Record<string, FormattedAjvError>);
    }

    public toString(): string {
        const formattedErrors = reduce(
            this.getSchemaErrorsWithProps(),
            (acc, { prop, value, errors }: FormattedAjvError) => {
                const errorsFormatted = errors.join(",");
                if (isPlainObject(value) || isArray(value)) {
                    return [...acc, `- ${prop} failed with "${errorsFormatted}"`];
                }
                if (!prop || !prop.length) {
                    return [...acc, `- ${value} failed with "${errorsFormatted}"`];
                }
                return [...acc, `- ${prop} (${value}) failed with "${errorsFormatted}"`];
            },
            [] as string[],
        ).join("\n");
        return `Schema validation failed with message: \n${formattedErrors}`;
    }

    private guessEntityName(): string {
        const constructorName = (this.entity as any).constructor.name;
        return constructorName === "Object" ? SchemaValidationError.ENTITY_ERROR : constructorName;
    }
}
