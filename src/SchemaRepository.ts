import { basename, join } from "path";
import glob from "glob";
import { uniq } from "lodash";

import { SchemaSymbolNotFoundError } from "./errors";
import { JSONSchema } from "./types";
import { compileSchema } from "./utils";

type JsonSchemaPaths = Record<string, { schema: JSONSchema; path: string }>;
type JsonSchemaCollection = Record<string, JSONSchema>;

export class SchemaRepository {
    private schemas: JsonSchemaCollection = {};
    private constructor(private rawSchemas: JsonSchemaPaths) {}

    private static getSchemasFromPath(schemaBasePath: string): JsonSchemaPaths {
        const schemaPaths = glob.sync(join(schemaBasePath, "**/*.json"));
        return schemaPaths.reduce((acc, path) => {
            const [sanitizedName] = basename(path).split(".");
            // eslint-disable-next-line import/no-dynamic-require, global-require
            return { ...acc, [sanitizedName]: { schema: require(path), path } };
        }, {});
    }

    public static create(...schemaBasePaths: string[]): SchemaRepository {
        const schemas = schemaBasePaths.reduce(
            (acc, schemaBasePath) => ({ ...acc, ...SchemaRepository.getSchemasFromPath(schemaBasePath) }),
            {} as JsonSchemaPaths,
        );

        return new SchemaRepository(schemas);
    }

    public async preflight(): Promise<void> {
        const schemaDirs = uniq(
            Object.values(this.rawSchemas).map(({ path }) => {
                return path.replace(basename(path), "");
            }),
        );

        this.schemas = (
            await Promise.all(
                Object.entries(this.rawSchemas).map(async ([name, { schema }]) => [
                    name,
                    await compileSchema(schema as JSONSchema, schemaDirs),
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
