-- Simple test without transaction
DEFINE TABLE test_table2 SCHEMAFULL;
DEFINE FIELD name ON TABLE test_table2 TYPE string;
CREATE test_table2 SET name = "test2";
