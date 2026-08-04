const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set');
}

// Service-role client: server-side only, must never be exposed to the client app.
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false },
});

const DOCUMENTS_BUCKET = process.env.SUPABASE_BUCKET || 'documents';

let bucketEnsured = false;

// Lazily creates the storage bucket on first use so a fresh Supabase project
// works out of the box without a manual dashboard step.
async function ensureBucket() {
  if (bucketEnsured) return;

  const { data } = await supabase.storage.getBucket(DOCUMENTS_BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
      public: false,
    });
    if (error && !/already exists/i.test(error.message)) {
      throw error;
    }
  }

  bucketEnsured = true;
}

module.exports = {
  supabase,
  DOCUMENTS_BUCKET,
  ensureBucket,
};
