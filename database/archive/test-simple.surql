-- Simple test migration
BEGIN TRANSACTION;

-- Create a simple table
DEFINE TABLE test_table SCHEMAFULL;

-- Define a simple field
DEFINE FIELD name ON TABLE test_table TYPE string;

-- Create a simple function
DEFINE FUNCTION fn::test_function($name: string) {
    RETURN "Hello " + $name;
};

-- Insert test data
CREATE test_table SET name = "test";

COMMIT TRANSACTION;