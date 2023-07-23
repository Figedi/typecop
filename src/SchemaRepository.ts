import { basename, join } from "path";
import { glob } from "glob";
import { readFile } from "node:fs/promises";
import { uniq } from "lodash";

import { SchemaSymbolNotFoundError } from "./errors";
import { JSONSchema } from "./types";
import { compileSchema } from "./utils";

type JsonSchemaPaths = Record<string, { schema: JSONSchema; path: string }>;
type JsonSchemaCollection = Record<string, JSONSchema>;

export class SchemaRepository {
    private schemas: JsonSchemaCollection = {};

    private constructor(private rawSchemas: JsonSchemaPaths) {}

    private static async readJson<TResult extends Record<string, any>>(path: string): Promise<TResult> {
        const content = await readFile(path, "utf-8");
        return JSON.parse(content);
    }

    private static async getSchemasFromPath(schemaBasePath: string): Promise<JsonSchemaPaths> {
        const schemaPaths = await glob(join(schemaBasePath, "**/*.json"));

        const schemas = await Promise.all(
            schemaPaths.map(p => {
                const [sanitizedName] = basename(p).split(".");
                return [sanitizedName, { schema: SchemaRepository.readJson(p), path: p }];
            }),
        );
        return Object.fromEntries(schemas);
    }

    public static async create(...schemaBasePaths: string[]): Promise<SchemaRepository> {
        const flattenedSchemas = (
            await Promise.all(
                schemaBasePaths.map(schemaBasePath => SchemaRepository.getSchemasFromPath(schemaBasePath)),
            )
        ).reduce((acc, schemas) => ({ ...acc, ...schemas }), {});

        return new SchemaRepository(flattenedSchemas);
    }

    public async preflight(): Promise<void> {
        const schemaDirs = uniq(Object.values(this.rawSchemas).map(({ path }) => path.replace(basename(path), "")));

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
