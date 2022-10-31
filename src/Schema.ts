import { JSONSchema7 } from "json-schema";
import { createValidator } from "./createValidator";
import { SchemaRepository } from "./SchemaRepository";

export class Schema<Type, ProjectedType = Type> {
    constructor(
        private schemaRepository: SchemaRepository,
        private schemaName: string,
        private projection?: (schema: JSONSchema7) => JSONSchema7,
        private validator = createValidator(),
    ) {}

    get schema(): JSONSchema7 {
        const schema = this.schemaRepository.getRawSchema(this.schemaName);
        if (this.projection) {
            return this.projection(schema);
        }
        return schema as ProjectedType;
    }

    is(obj: unknown): obj is ProjectedType {
        return this.validator.is(this.schema, obj);
    }

    validate(obj: unknown): boolean {
        return this.validator.validate(this.schema, obj);
    }
}
