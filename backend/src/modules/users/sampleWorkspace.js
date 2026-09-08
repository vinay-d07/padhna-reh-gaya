const fs = require('fs');
const path = require('path');
const logger = require('../../lib/logger');
const workspaceService = require('../workspaces/services');
const uploadService = require('../uploads/services');

const SAMPLE_FILE_PATH = path.join(__dirname, '../../../assets/sample-document.txt');
const SAMPLE_WORKSPACE_NAME = 'Try Padhle';

// Auto-seeded once for every brand-new account so a first-time user can ask a
// question and see a cited answer before uploading anything of their own —
// removes the "upload something first" barrier from the first 60 seconds.
// Fire-and-forget from the caller's perspective: a failure here shouldn't
// block signup, so every error is caught and logged rather than thrown.
async function seedSampleWorkspace(user) {
  const workspace = await workspaceService.createWorkspace({
    clerkId: user.clerkId,
    name: SAMPLE_WORKSPACE_NAME,
    description: 'A sample workspace so you can see Padhle in action before uploading your own documents.',
  });

  const buffer = fs.readFileSync(SAMPLE_FILE_PATH);
  await uploadService.uploadDocument({
    workspaceId: workspace.id,
    clerkId: user.clerkId,
    title: 'How Spaced Repetition Works',
    file: {
      originalname: 'how-spaced-repetition-works.txt',
      mimetype: 'text/plain',
      size: buffer.length,
      buffer,
    },
  });

  return workspace;
}

function seedSampleWorkspaceInBackground(user) {
  seedSampleWorkspace(user).catch((error) => {
    logger.error({ err: error, userId: user.id }, 'failed to seed sample workspace for new user');
  });
}

module.exports = { seedSampleWorkspace, seedSampleWorkspaceInBackground };
