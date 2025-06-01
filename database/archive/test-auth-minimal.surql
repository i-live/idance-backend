-- Minimal authentication test
BEGIN TRANSACTION;

-- Simple function with parameters (like your migration)
DEFINE FUNCTION fn::test_signup($email: string, $password: string) {
    LET $existing = SELECT * FROM user WHERE email = $email;
    
    IF array::len($existing) > 0 {
        THROW "User already exists";
    };
    
    RETURN "User can be created";
};

COMMIT TRANSACTION;