--  permitir explicar falhas gerais que não pertencem a uma linha específica.

ALTER TABLE imports
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;
