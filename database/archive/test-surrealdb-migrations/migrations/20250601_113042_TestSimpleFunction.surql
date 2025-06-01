-- Test migration with function (similar to our auth issues)

-- Create a simple table
DEFINE TABLE test_user SCHEMAFULL;
DEFINE FIELD email ON test_user TYPE string;
DEFINE FIELD password ON test_user TYPE string;

-- Create a function with parameters (this was causing our parsing issues)
DEFINE FUNCTION fn::test_signup($email: string, $password: string) {
    LET $existing = SELECT * FROM test_user WHERE email = $email;
    
    IF array::len($existing) > 0 {
        THROW "User already exists";
    };
    
    CREATE test_user SET 
        email = $email,
        password = crypto::argon2::generate($password),
        created_at = time::now();
    
    RETURN "User created successfully";
};

-- Test the function works
CREATE test_user SET email = "test@example.com", password = "hashed_password", created_at = time::now();
