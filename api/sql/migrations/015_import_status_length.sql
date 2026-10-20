-- Aumenta o limite para permitir o status completed_with_errors.
ALTER TABLE imports
  ALTER COLUMN status TYPE VARCHAR(32);
