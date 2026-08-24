const prisma = require('../lib/prisma');
const userRepo = require('../modules/users/repo');
const notesRepo = require('../modules/notes/repo');
const chatRepo = require('../modules/chat/repo');

const ROLE_RANK = { VIEWER: 1, EDITOR: 2, OWNER: 3 };

async function loadMembership(clerkId, workspaceId) {
  const user = await userRepo.findUserByClerkId(clerkId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  });
  return { user, membership };
}

function forbid(res) {
  return res.status(403).json({ success: false, message: 'You do not have access to this workspace' });
}

function handleAccessError(res, error) {
  return res.status(error.statusCode || 400).json({ success: false, message: error.message });
}

// Verifies req.clerkId is at least `minRole` on the workspace named by
// req.params[paramName], and attaches req.dbUser / req.workspaceMembership
// for downstream handlers. Must run after requireAuth.
function requireWorkspaceRole(minRole, { paramName = 'workspaceId' } = {}) {
  return async function (req, res, next) {
    try {
      const workspaceId = req.params[paramName];
      if (!workspaceId) {
        return res.status(400).json({ success: false, message: `${paramName} is required` });
      }
      const { user, membership } = await loadMembership(req.clerkId, workspaceId);
      if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
        return forbid(res);
      }
      req.dbUser = user;
      req.workspaceMembership = membership;
      next();
    } catch (error) {
      return handleAccessError(res, error);
    }
  };
}

// Same as requireWorkspaceRole but for /notes/:noteId routes, which don't
// carry workspaceId in the URL — resolves it via the note first.
function requireNoteRole(minRole) {
  return async function (req, res, next) {
    try {
      const note = await notesRepo.findNoteById(req.params.noteId);
      if (!note) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }
      const { user, membership } = await loadMembership(req.clerkId, note.workspaceId);
      if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
        return forbid(res);
      }
      req.dbUser = user;
      req.note = note;
      next();
    } catch (error) {
      return handleAccessError(res, error);
    }
  };
}

// Same idea for /conversations/:conversationId routes.
function requireConversationRole(minRole) {
  return async function (req, res, next) {
    try {
      const conversation = await chatRepo.findConversationById(req.params.conversationId);
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
      const { user, membership } = await loadMembership(req.clerkId, conversation.workspaceId);
      if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
        return forbid(res);
      }
      req.dbUser = user;
      req.conversation = conversation;
      next();
    } catch (error) {
      return handleAccessError(res, error);
    }
  };
}

// For routes with no workspace/note/conversation to scope against (e.g. the
// global study-rooms API) — just resolves req.clerkId to the app's User row
// so controllers can read req.dbUser.id like every other module does.
async function requireDbUser(req, res, next) {
  try {
    const user = await userRepo.findUserByClerkId(req.clerkId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    req.dbUser = user;
    next();
  } catch (error) {
    return handleAccessError(res, error);
  }
}

module.exports = { requireWorkspaceRole, requireNoteRole, requireConversationRole, requireDbUser };
