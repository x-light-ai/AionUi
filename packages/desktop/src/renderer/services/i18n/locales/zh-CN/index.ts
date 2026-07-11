/**
 * zh-CN locale module index
 * Exports all translation modules for Chinese (Simplified)
 */

import common from './common.json';
import agentMode from './agentMode.json';
import update from './update.json';
import login from './login.json';
import fileSelection from './fileSelection.json';
import preview from './preview.json';
import conversation from './conversation.json';
import settings from './settings.json';
import messages from './messages.json';
import mcp from './mcp.json';
import acp from './acp.json';
import codex from './codex.json';
import tools from './tools.json';
import google from './google.json';
import cron from './cron.json';
import guid from './guid.json';
import agent from './agent.json';
import team from './team.json';
import pet from './pet.json';
// FORK-CUSTOM: fork-only translations（命名空间遵循 xaiwork 前缀约定）
import xaiwork from './xaiwork.json';

export default {
  common,
  agentMode,
  update,
  login,
  fileSelection,
  preview,
  conversation,
  settings,
  messages,
  mcp,
  acp,
  codex,
  tools,
  google,
  cron,
  guid,
  agent,
  team,
  pet,
  // FORK-CUSTOM: register the isolated XAIWork translation namespace.
  xaiwork,
};
