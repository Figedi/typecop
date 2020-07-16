import { expect } from "chai";
import { join } from "path";
import { createValidator } from "./createValidator";
import { invalidRootFixture, rootFixture } from "./shared.specFiles/fixtures";
import { SchemaValidationError } from "./ValidationError";

describe("createValidator", () => {
    const SCHEMA_PATH = join(__dirname, "../resources");
    // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
    const ROOT_SCHEMA = require(join(SCHEMA_PATH, "root.schema.json"));

    it("compiles schema-paths & validates a json-schema w/ $ref", async () => {
        const validator = createValidator();
        const compiledSchema = await validator.compile(join(SCHEMA_PATH, "root.schema.json"));

        const isValid = validator.validate(compiledSchema, rootFixture);
        expect(isValid).to.eq(true);
    });

    it("dereferences schemas & validates a json-schema w/ $ref", async () => {
        const validator = createValidator();
        const compiledSchema = await validator.compile(ROOT_SCHEMA, { schemaDirs: [SCHEMA_PATH] });

        const isValid = validator.validate(compiledSchema, rootFixture);
        expect(isValid).to.eq(true);
    });

    it("throws for invalid objects", async () => {
        const validator = createValidator();
        const compiledSchema = await validator.compile(join(SCHEMA_PATH, "root.schema.json"));

        try {
            validator.validate(compiledSchema, invalidRootFixture);
            throw new Error("validator-should-throw");
        } catch (e) {
            expect(e instanceof SchemaValidationError).to.eq(true);
            expect((e as SchemaValidationError<typeof invalidRootFixture>).failedEntity).to.deep.eq(invalidRootFixture);
            expect((e as SchemaValidationError<typeof invalidRootFixture>).getSchemaErrorsWithProps()).to.deep.eq({
                "column1.id": {
                    errors: ["should be string"],
                    prop: "column1.id",
                    value: 400,
                },
            });
        }
    });
});
