import { basename, join } from "path";
import glob from "glob";

import { SchemaSymbolNotFoundError } from "./errors";
import { JSONSchema } from "./types";
import { compileSchema } from "./utils";

type JsonSchemaCollection = Record<string, JSONSchema>;

export class SchemaRepository {
    private schemas: JsonSchemaCollection = {};
    private constructor(private schemaBasePaths: string[], private rawSchemas: JsonSchemaCollection) {}

    private static getSchemasFromPath(schemaBasePath: string): JsonSchemaCollection {
        const schemaPaths = glob.sync(join(schemaBasePath, "**/*.json"));
        return schemaPaths.reduce((acc, path) => {
            const [sanitizedName] = basename(path).split(".");
            // eslint-disable-next-line import/no-dynamic-require, global-require
            return { ...acc, [sanitizedName]: require(path) };
        }, {});
    }

    public static create(...schemaBasePaths: string[]): SchemaRepository {
        const schemas = schemaBasePaths.reduce(
            (acc, schemaBasePath) => ({ ...acc, ...SchemaRepository.getSchemasFromPath(schemaBasePath) }),
            {},
        );

        return new SchemaRepository(schemaBasePaths, schemas);
    }

    public async preflight(): Promise<void> {
        this.schemas = (
            await Promise.all(
                Object.entries(this.rawSchemas).map(async ([name, schema]) => [
                    name,
                    await compileSchema(schema as JSONSchema, { schemaDirs: this.schemaBasePaths }),
                ]),
            )
        ).reduce<JsonSchemaCollection>(
            (acc, [key, value]) => ({ ...acc, [key as string]: value as JSONSchema }),
            {} as JsonSchemaCollection,
        );
    }

    public getRawSchema<Type>(schemaName: string): JSONSchema<Type> {
        const schema = this.schemas[schemaName as keyof JsonSchemaCollection];
        if (!schema) {
            throw new SchemaSymbolNotFoundError(`Schema with name ${schemaName} not found in registry.`);
        }
        return schema;
    }
}
