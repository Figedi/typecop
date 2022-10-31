import { JSONSchema7 } from "json-schema";
import { basename, join } from "path";
import glob from "glob";
import { uniq } from "lodash";

import { SchemaSymbolNotFoundError } from "./errors";
import { SchemaValidator } from "./createValidator";

type JsonSchemaPaths = Record<string, { schema: JSONSchema7; path: string }>;
type JsonSchemaCollection = Record<string, JSONSchema7>;

export class SchemaRepository {
    private schemas: JsonSchemaCollection = {};

    private constructor(private validator: SchemaValidator, private rawSchemas: JsonSchemaPaths) {}

    private static getSchemasFromPath(schemaBasePath: string): JsonSchemaPaths {
        const schemaPaths = glob.sync(join(schemaBasePath, "**/*.json"));
        return schemaPaths.reduce((acc, path) => {
            const [sanitizedName] = basename(path).split(".");
            // eslint-disable-next-line import/no-dynamic-require, global-require
            return { ...acc, [sanitizedName]: { schema: require(path), path } };
        }, {});
    }

    public static create(validator: SchemaValidator, ...schemaBasePaths: string[]): SchemaRepository {
        const schemas = schemaBasePaths.reduce(
            (acc, schemaBasePath) => ({ ...acc, ...SchemaRepository.getSchemasFromPath(schemaBasePath) }),
            {} as JsonSchemaPaths,
        );

        return new SchemaRepository(validator, schemas);
    }

    public async preflight(): Promise<void> {
        const schemaDirs = uniq(Object.values(this.rawSchemas).map(({ path }) => path.replace(basename(path), "")));

        this.schemas = (
            await Promise.all(
                Object.entries(this.rawSchemas).map(async ([name, { schema }]) => [
                    name,
                    await this.validator.compile(schema as JSONSchema7, schemaDirs),
                ]),
            )
        ).reduce<JsonSchemaCollection>(
            (acc, [key, value]) => ({ ...acc, [key as string]: value as JSONSchema7 }),
            {} as JsonSchemaCollection,
        );
    }

    public getRawSchema(schemaName: string): JSONSchema7 {
        const schema = this.schemas[schemaName as keyof JsonSchemaCollection];
        if (!schema) {
            throw new SchemaSymbolNotFoundError(`Schema with name ${schemaName} not found in registry.`);
        }
        return schema;
    }
}
