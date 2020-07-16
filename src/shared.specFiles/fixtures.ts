export type RootExampleType = {
    id: string;
    column1: ChildExampleType;
    column2: number;
};

export type ChildExampleType = {
    id: string;
    column1: number;
};

export const rootFixture: RootExampleType = {
    id: "abc123",
    column1: {
        id: "bcd456",
        column1: 1337,
    },
    column2: 42,
};

export const invalidRootFixture = {
    id: "abc123",
    column1: {
        id: 400,
    },
};
