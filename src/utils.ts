/* eslint-disable import/no-named-default */
import { JSONSchema7 } from "json-schema";
import { default as RefParser, ResolverOptions } from "json-schema-ref-parser";
import { readFile } from "fs/promises";
import { join, basename } from "path";

const createLocalFileResolver = (rootPath: string): ResolverOptions => ({
    order: 1,

    canRead: /\.json$/i,

    async read(file) {
        try {
            return await readFile(file.url);
        } catch (e: any) {
            if (e.code === "ENOENT") {
                const newPath = join(rootPath, basename(file.url));
                return readFile(newPath);
            }
            throw e;
        }
    },
});

export const combineJsonSchemas = (...schemas: JSONSchema7[]): JSONSchema7 => ({
    $id: schemas
        .map(({ $id }) => $id)
        .join("-")
        .concat("__combined"),
    type: "object",
    oneOf: schemas,
});

export const compileSchema = async (
    rootSchemaPath: string | JSONSchema7,
    schemaDirs?: string[],
): Promise<JSONSchema7> => {
    const refParser = new RefParser();
    const jsonSchema = await refParser.dereference(
        rootSchemaPath,
        schemaDirs
            ? {
                  resolve: schemaDirs.reduce(
                      (acc, schemaDir, i) => ({ ...acc, [`local_${i}`]: createLocalFileResolver(schemaDir) }),
                      {},
                  ),
              }
            : {},
    );

    return jsonSchema as any as JSONSchema7;
};
