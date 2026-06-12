import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umbszkxznccaegdmwjmf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYnN6a3h6bmNjYWVnZG13am1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI0OTU0MywiZXhwIjoyMDk2ODI1NTQzfQ.w5S79I-zDR_7ecPHqklt1UP6b9By_2wltDMWmkrZQv0';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Testing master_user...");
  const { data, error } = await supabaseAdmin
    .from('master_user')
    .select('*')
    .limit(1);
    
  if (error) console.error("Error master_user:", error);
  else console.log("Success master_user:", data);

  console.log("Testing commits...");
  const { data: com, error: comErr } = await supabaseAdmin
    .from('commits')
    .select('*')
    .limit(1);

  if (comErr) console.error("Error commits:", comErr);
  else console.log("Success commits:", com);

  console.log("Testing pull_requests...");
  const { data: pr, error: prErr } = await supabaseAdmin
    .from('pull_requests')
    .select('*')
    .limit(1);

  if (prErr) console.error("Error pr:", prErr);
  else console.log("Success pr:", pr);
}

test();
