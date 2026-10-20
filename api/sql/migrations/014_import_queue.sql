-- a API enfileirada cria importações com status 'queued'.

ALTER TABLE imports
  DROP CONSTRAINT IF EXISTS imports_status_chk;

ALTER TABLE imports
  ADD CONSTRAINT imports_status_chk CHECK (
    status IN ('queued', 'processing', 'completed', 'completed_with_errors', 'failed')
  );
