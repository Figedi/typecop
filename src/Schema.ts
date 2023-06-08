import { createValidator } from "./createValidator";
import { JSONSchema } from "./types";
import { SchemaRepository } from "./SchemaRepository";

export class Schema<Type, ProjectedType = Type> {
    constructor(
        private schemaRepository: SchemaRepository,
        private schemaName: string,
        private projection?: (schema: JSONSchema<Type>) => JSONSchema<ProjectedType>,
        private validator = createValidator(),
    ) {}

    get schema(): JSONSchema<ProjectedType> {
        const schema = this.schemaRepository.getRawSchema<Type>(this.schemaName);
        if (this.projection) {
            return this.projection(schema);
        }
        return schema as JSONSchema<ProjectedType>;
    }

    is(obj: unknown): obj is ProjectedType {
        return this.validator.is(this.schema, obj);
    }

    validate(obj: unknown): boolean {
        return this.validator.validate(this.schema, obj);
    }
}
