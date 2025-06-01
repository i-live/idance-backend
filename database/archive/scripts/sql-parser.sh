#!/bin/bash

# SQL Parser for SurrealDB migrations
# Splits SQL files into individual statements and executes them one by one

parse_and_execute_sql() {
    local sql_file="$1"
    local temp_dir=$(mktemp -d)
    local statement_file="$temp_dir/statement.sql"
    local current_statement=""
    local in_function=false
    local brace_count=0
    local line_number=0
    local statement_count=0
    
    echo "📄 Parsing SQL file: $(basename "$sql_file")"
    
    while IFS= read -r line || [[ -n "$line" ]]; do
        ((line_number++))
        
        # Skip empty lines and comments at the start of lines
        if [[ "$line" =~ ^[[:space:]]*$ ]] || [[ "$line" =~ ^[[:space:]]*-- ]]; then
            continue
        fi
        
        # Remove inline comments but preserve the rest of the line
        line=$(echo "$line" | sed 's/--.*$//')
        
        # Skip if line becomes empty after comment removal
        if [[ "$line" =~ ^[[:space:]]*$ ]]; then
            continue
        fi
        
        # Add line to current statement
        if [[ -n "$current_statement" ]]; then
            current_statement="$current_statement"$'\n'"$line"
        else
            current_statement="$line"
        fi
        
        # Track if we're inside a function definition
        if [[ "$line" =~ DEFINE[[:space:]]+FUNCTION ]]; then
            in_function=true
            brace_count=0
        fi
        
        # Count braces to track function boundaries
        if [[ "$in_function" == true ]]; then
            # Count opening braces
            local open_braces=$(echo "$line" | grep -o '{' | wc -l)
            # Count closing braces
            local close_braces=$(echo "$line" | grep -o '}' | wc -l)
            
            brace_count=$((brace_count + open_braces - close_braces))
            
            # If we've closed all braces, the function is complete
            if [[ $brace_count -eq 0 ]] && [[ $open_braces -gt 0 || $close_braces -gt 0 ]]; then
                in_function=false
                # Execute the complete function
                execute_single_statement "$current_statement" $((++statement_count))
                current_statement=""
                continue
            fi
        fi
        
        # For non-function statements, check if line ends with semicolon
        if [[ "$in_function" == false ]] && [[ "$line" =~ \;[[:space:]]*$ ]]; then
            # Remove the semicolon and execute
            current_statement=$(echo "$current_statement" | sed 's/;[[:space:]]*$//')
            execute_single_statement "$current_statement" $((++statement_count))
            current_statement=""
        fi
        
    done < "$sql_file"
    
    # Execute any remaining statement
    if [[ -n "$current_statement" ]]; then
        execute_single_statement "$current_statement" $((++statement_count))
    fi
    
    rm -rf "$temp_dir"
    echo "✅ Parsed and executed $statement_count statements"
}

execute_single_statement() {
    local statement="$1"
    local stmt_num="$2"
    
    # Skip transaction statements - they're not supported
    if [[ "$statement" =~ ^[[:space:]]*(BEGIN|COMMIT|ROLLBACK)[[:space:]]+TRANSACTION ]]; then
        echo "  ⏭️  Skipping transaction statement: $(echo "$statement" | head -1)"
        return 0
    fi
    
    echo "  🔄 Statement $stmt_num: $(echo "$statement" | head -1 | cut -c1-60)..."
    
    # Execute the statement
    if echo "$statement" | surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome > /dev/null 2>&1; then
        echo "    ✅ Success"
        return 0
    else
        echo "    ❌ Failed"
        echo "Statement was:"
        echo "$statement" | sed 's/^/      /'
        echo ""
        echo "Error output:"
        echo "$statement" | surreal sql --endpoint "$SURREALDB_URL" --username "$SURREALDB_ROOT_USER" --password "$SURREALDB_ROOT_PASS" --namespace "$SURREALDB_NAMESPACE" --database "$SURREALDB_DATABASE" --hide-welcome 2>&1 | sed 's/^/      /'
        return 1
    fi
}