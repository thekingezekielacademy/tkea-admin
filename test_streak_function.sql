-- Simple test function to verify SQL syntax
-- Run this first to check if basic function creation works

-- Test 1: Basic function creation
CREATE OR REPLACE FUNCTION test_basic_function()
RETURNS TEXT AS $$
BEGIN
  RETURN 'Basic function works!';
END;
$$ LANGUAGE plpgsql;

-- Test 2: Function with IF statements
CREATE OR REPLACE FUNCTION test_if_statement()
RETURNS TEXT AS $$
DECLARE
  test_date DATE := CURRENT_DATE;
BEGIN
  IF test_date = CURRENT_DATE THEN
    RETURN 'Today is today!';
  ELSIF test_date = CURRENT_DATE - INTERVAL '1 day' THEN
    RETURN 'Yesterday!';
  ELSE
    RETURN 'Some other day!';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Test 3: Function with date arithmetic
CREATE OR REPLACE FUNCTION test_date_arithmetic()
RETURNS TEXT AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  today DATE := CURRENT_DATE;
BEGIN
  RETURN 'Yesterday: ' || yesterday || ', Today: ' || today;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT test_basic_function();
SELECT test_if_statement();
SELECT test_date_arithmetic();

-- Clean up test functions
DROP FUNCTION IF EXISTS test_basic_function();
DROP FUNCTION IF EXISTS test_if_statement();
DROP FUNCTION IF EXISTS test_date_arithmetic();
