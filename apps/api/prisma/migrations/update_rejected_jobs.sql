-- Update existing jobs that have rejected approvals to have REJECTED status
-- This is a one-time migration to fix jobs that were rejected before we added the REJECTED status

UPDATE jobs 
SET status = 'REJECTED'
WHERE id IN (
  SELECT DISTINCT "jobId" 
  FROM job_approvals 
  WHERE status = 'REJECTED'
) 
AND status = 'DRAFT';
