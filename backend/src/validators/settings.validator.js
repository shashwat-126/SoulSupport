const Joi = require('joi');

exports.updateSettingsSchema = Joi.object({
  notificationPreferences: Joi.object({
    emailSessionReminders: Joi.boolean(),
    emailCommunityReplies: Joi.boolean(),
    inAppSessionUpdates: Joi.boolean(),
    inAppForumActivity: Joi.boolean(),
    marketingEmails: Joi.boolean(),
  }),
  accountPreferences: Joi.object({
    privateProfile: Joi.boolean(),
    twoFactorEnabled: Joi.boolean(),
  }),
}).min(1);

exports.deleteAccountSchema = Joi.object({
  currentPassword: Joi.string().min(8).required(),
  confirmText: Joi.string().valid('DELETE').required(),
});