# Typecop

JSON-schema validation with some extras. It a cop for your types. Sorry for the bad pun.

![timecop](https://upload.wikimedia.org/wikipedia/en/7/79/Timecopposter.jpg "timecop")

## Features
This library is a small wrapper around [ajv](https://github.com/ajv-validator/ajv). It provides some common functionalities I often needed for schema-validation:
- Small file-base schema-repository
- "Better", more readable errors for tracing
- Schema-classes w/ typeguards
- utilities, e.g. for composing schemas for message envelopes

## Usage

Example for using Schema-classes w/ SchemaRepository
```typescript 
import { SchemaRepository } from "@figedi/typecop";

// see resources root.schema.json for definition
type RootExampleType = { 
  id: string;
  column1: ChildExampleType;
  column2: number;
};

const SCHEMA_PATH = join(__dirname, "./resources");
const schemaRepository = SchemaRepository.create(SCHEMA_PATH);
await schemaRepository.preflight(); // loads all schemas, can be run at startup-phase
const RootSchema = new Schema<RootExampleType>(schemaRepository, "root");
RootSchema.is({ some: "object" }) // true/false, typeguard
RootSchema.validate({ some: "object" }) // throws in case of errors
```

Example for base-validator usage
```typescript 
import { createValidator } from "@figedi/typecop";
const validator = createValidator();
// loads the json-schema, de-references all contained $ref's
const compiledSchema = await validator.compile(join(SCHEMA_PATH, "root.schema.json"));
validator.validate(compiledSchema, { some: "object" });
```

