import { expect } from "chai";
import { join } from "path";
import { SchemaRepository } from "./SchemaRepository";
import { RootExampleType, rootFixture } from "./shared.specFiles/fixtures";
import { Schema } from "./Schema";
import { JSONSchema } from "./types";

interface Wrapped<T> {
    wrapped: T;
}
const exampleSchemaWrapper = <T>(schema: JSONSchema<T>): JSONSchema<Wrapped<T>> => ({
    $id: `${schema.$id}-wrapped-${Math.random()}`,
    type: "object",
    properties: {
        wrapped: schema,
    },
    required: ["wrapped"],
});

describe("SchemaRepository", () => {
    const SCHEMA_PATH = join(__dirname, "../resources");
    let schemaRepository: SchemaRepository
    before(async () => {
        schemaRepository = await SchemaRepository.create(SCHEMA_PATH);
    })

    it("loads & compiles schemas from a path", async () => {
        await schemaRepository.preflight();
        const root = schemaRepository.getRawSchema<RootExampleType>("root");
        expect(root.properties!.column1.properties!.column1).to.not.eq(undefined);
    });

    it("resolves & validates correctly with Schema-base-class", async () => {
        await schemaRepository.preflight();
        const RootSchema = new Schema(schemaRepository, "root");
        expect(RootSchema.is(rootFixture)).to.eq(true);
    });

    describe("Schema", () => {
        it("resolves & validates correctly with Schema-base-class in a lazy fashion", async () => {
            const RootSchema = new Schema(schemaRepository, "root");
            await schemaRepository.preflight(); // this materializes the jsonSchemas, the RootSchema should still work
            expect(RootSchema.is(rootFixture)).to.eq(true);
        });

        it("is able to project a given schema", async () => {
            const RootSchema = new Schema<RootExampleType, Wrapped<RootExampleType>>(
                schemaRepository,
                "root",
                exampleSchemaWrapper,
            );
            await schemaRepository.preflight(); // this materializes the jsonSchemas, the RootSchema should still work
            expect(RootSchema.is({ wrapped: rootFixture })).to.eq(true);
            expect(RootSchema.is(rootFixture)).to.eq(false);
        });
    });
});
