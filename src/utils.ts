import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import refParser from '@apidevtools/json-schema-ref-parser';
import { ResolverOptions } from '@apidevtools/json-schema-ref-parser/dist/lib/types';

import { JSONSchema } from './types';

const createLocalFileResolver = (rootPath: string): ResolverOptions => ({
    order: 1,

    canRead: /\.json$/i,

    async read(file) {
        try {
            return await readFile(file.url);
        } catch (e) {
            if (e.code === 'ENOENT') {
                const newPath = join(rootPath, basename(file.url));
                return readFile(newPath);
            }
            throw e;
        }
    },
});

export const combineJsonSchemas = <Input, Output>(...schemas: JSONSchema<Input>[]): JSONSchema<Output> => ({
    $id: schemas
        .map(({ $id }) => $id)
        .join('-')
        .concat('__combined'),
    type: 'object',
    oneOf: schemas,
});

export const compileSchema = async <Type>(rootSchemaPath: string | JSONSchema<Type>, schemaDirs?: string[]): Promise<JSONSchema<Type>> =>
    (await refParser.dereference(
        rootSchemaPath as unknown as string, // incompatible typing w/ our custom JSONSchema-type
        schemaDirs
            ? {
                  resolve: schemaDirs.reduce((acc, schemaDir, i) => ({ ...acc, [`local_${i}`]: createLocalFileResolver(schemaDir) }), {}),
              }
            : {},
    )) as unknown as JSONSchema<Type>;
