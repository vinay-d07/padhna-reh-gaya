const chatService = require('./services');

async function listConversations(req, res) {
  try {
    const { workspaceId } = req.params;
    const conversations = await chatService.listConversations(workspaceId);
    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    const statusCode = error.message === 'Workspace not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function createConversation(req, res) {
  try {
    const { workspaceId } = req.params;
    const { title } = req.body;
    const conversation = await chatService.createConversation({
      workspaceId,
      clerkId: req.clerkId,
      title,
    });
    return res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation,
    });
  } catch (error) {
    const statusCode =
      error.message === 'Workspace not found' || error.message === 'User not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

async function listMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const messages = await chatService.getMessages(conversationId);
    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    const statusCode = error.message === 'Conversation not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

// Streams the assistant's answer as Server-Sent Events:
//   event: token  data: { "token": "..." }      (repeated)
//   event: done   data: { "assistantMessage": {...} }
//   event: error  data: { "message": "..." }
async function sendMessage(req, res) {
  const { conversationId } = req.params;
  const { content } = req.body;
  const clerkId = req.clerkId;

  try {
    await chatService.assertConversationAccessible(conversationId, clerkId);
  } catch (error) {
    const statusCode =
      error.message === 'Conversation not found' || error.message === 'User not found' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { assistantMessage } = await chatService.streamMessage({
      conversationId,
      clerkId,
      content,
      onToken: (token) => send('token', { token }),
    });
    send('done', { assistantMessage });
  } catch (error) {
    send('error', { message: error.message });
  } finally {
    res.end();
  }
}

module.exports = {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
};
