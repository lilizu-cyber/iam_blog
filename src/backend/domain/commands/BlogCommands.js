const { v4: uuidv4 } = require('uuid');

// Base Command class
class Command {
  constructor(type, data, metadata = {}) {
    this.id = uuidv4();
    this.type = type;
    this.timestamp = new Date().toISOString();
    this.data = data;
    this.metadata = metadata;
  }
}

// Blog Post Commands
class CreateBlogPostCommand extends Command {
  constructor(data, metadata = {}) {
    super('CreateBlogPost', data, metadata);
    
    // Validate required fields
    if (!data.title || !data.content || !data.authorId) {
      throw new Error('CreateBlogPost command requires title, content, and authorId');
    }
  }
}

class UpdateBlogPostCommand extends Command {
  constructor(data, metadata = {}) {
    super('UpdateBlogPost', data, metadata);
    
    if (!data.postId) {
      throw new Error('UpdateBlogPost command requires postId');
    }
  }
}

class PublishBlogPostCommand extends Command {
  constructor(data, metadata = {}) {
    super('PublishBlogPost', data, metadata);
    
    if (!data.postId || !data.authorId) {
      throw new Error('PublishBlogPost command requires postId and authorId');
    }
  }
}

class UnpublishBlogPostCommand extends Command {
  constructor(data, metadata = {}) {
    super('UnpublishBlogPost', data, metadata);
    
    if (!data.postId || !data.authorId) {
      throw new Error('UnpublishBlogPost command requires postId and authorId');
    }
  }
}

class DeleteBlogPostCommand extends Command {
  constructor(data, metadata = {}) {
    super('DeleteBlogPost', data, metadata);
    
    if (!data.postId || !data.authorId) {
      throw new Error('DeleteBlogPost command requires postId and authorId');
    }
  }
}

class AddTagToBlogPostCommand extends Command {
  constructor(data, metadata = {}) {
    super('AddTagToBlogPost', data, metadata);
    
    if (!data.postId || !data.tag) {
      throw new Error('AddTagToBlogPost command requires postId and tag');
    }
  }
}

class RemoveTagFromBlogPostCommand extends Command {
  constructor(data, metadata = {}) {
    super('RemoveTagFromBlogPost', data, metadata);
    
    if (!data.postId || !data.tag) {
      throw new Error('RemoveTagFromBlogPost command requires postId and tag');
    }
  }
}

class GenerateBlogPostCommand extends Command {
  constructor(data, metadata = {}) {
    super('GenerateBlogPost', data, metadata);
    
    if (!data.prompt || !data.authorId) {
      throw new Error('GenerateBlogPost command requires prompt and authorId');
    }
  }
}

// Comment Commands
class AddCommentCommand extends Command {
  constructor(data, metadata = {}) {
    super('AddComment', data, metadata);
    
    if (!data.postId || !data.content || !data.authorId) {
      throw new Error('AddComment command requires postId, content, and authorId');
    }
  }
}

class UpdateCommentCommand extends Command {
  constructor(data, metadata = {}) {
    super('UpdateComment', data, metadata);
    
    if (!data.commentId || !data.content || !data.authorId) {
      throw new Error('UpdateComment command requires commentId, content, and authorId');
    }
  }
}

class DeleteCommentCommand extends Command {
  constructor(data, metadata = {}) {
    super('DeleteComment', data, metadata);
    
    if (!data.commentId || !data.authorId) {
      throw new Error('DeleteComment command requires commentId and authorId');
    }
  }
}

class ModerateCommentCommand extends Command {
  constructor(data, metadata = {}) {
    super('ModerateComment', data, metadata);
    
    if (!data.commentId || !data.moderatorId || !data.action) {
      throw new Error('ModerateComment command requires commentId, moderatorId, and action');
    }
  }
}

// User Commands
class RegisterUserCommand extends Command {
  constructor(data, metadata = {}) {
    super('RegisterUser', data, metadata);
    
    if (!data.email || !data.password || !data.username) {
      throw new Error('RegisterUser command requires email, password, and username');
    }
  }
}

class UpdateUserProfileCommand extends Command {
  constructor(data, metadata = {}) {
    super('UpdateUserProfile', data, metadata);
    
    if (!data.userId) {
      throw new Error('UpdateUserProfile command requires userId');
    }
  }
}

class ChangeUserPasswordCommand extends Command {
  constructor(data, metadata = {}) {
    super('ChangeUserPassword', data, metadata);
    
    if (!data.userId || !data.currentPassword || !data.newPassword) {
      throw new Error('ChangeUserPassword command requires userId, currentPassword, and newPassword');
    }
  }
}

class DeactivateUserCommand extends Command {
  constructor(data, metadata = {}) {
    super('DeactivateUser', data, metadata);
    
    if (!data.userId) {
      throw new Error('DeactivateUser command requires userId');
    }
  }
}

class ActivateUserCommand extends Command {
  constructor(data, metadata = {}) {
    super('ActivateUser', data, metadata);
    
    if (!data.userId) {
      throw new Error('ActivateUser command requires userId');
    }
  }
}

// Category Commands
class CreateCategoryCommand extends Command {
  constructor(data, metadata = {}) {
    super('CreateCategory', data, metadata);
    
    if (!data.name || !data.createdBy) {
      throw new Error('CreateCategory command requires name and createdBy');
    }
  }
}

class UpdateCategoryCommand extends Command {
  constructor(data, metadata = {}) {
    super('UpdateCategory', data, metadata);
    
    if (!data.categoryId) {
      throw new Error('UpdateCategory command requires categoryId');
    }
  }
}

class DeleteCategoryCommand extends Command {
  constructor(data, metadata = {}) {
    super('DeleteCategory', data, metadata);
    
    if (!data.categoryId || !data.deletedBy) {
      throw new Error('DeleteCategory command requires categoryId and deletedBy');
    }
  }
}

// Analytics Commands
class TrackPageViewCommand extends Command {
  constructor(data, metadata = {}) {
    super('TrackPageView', data, metadata);
    
    if (!data.postId) {
      throw new Error('TrackPageView command requires postId');
    }
  }
}

class TrackUserEngagementCommand extends Command {
  constructor(data, metadata = {}) {
    super('TrackUserEngagement', data, metadata);
    
    if (!data.userId || !data.action) {
      throw new Error('TrackUserEngagement command requires userId and action');
    }
  }
}

// Newsletter Commands
class SubscribeToNewsletterCommand extends Command {
  constructor(data, metadata = {}) {
    super('SubscribeToNewsletter', data, metadata);
    
    if (!data.email) {
      throw new Error('SubscribeToNewsletter command requires email');
    }
  }
}

class UnsubscribeFromNewsletterCommand extends Command {
  constructor(data, metadata = {}) {
    super('UnsubscribeFromNewsletter', data, metadata);
    
    if (!data.email) {
      throw new Error('UnsubscribeFromNewsletter command requires email');
    }
  }
}

class SendNewsletterCommand extends Command {
  constructor(data, metadata = {}) {
    super('SendNewsletter', data, metadata);
    
    if (!data.subject || !data.content || !data.sentBy) {
      throw new Error('SendNewsletter command requires subject, content, and sentBy');
    }
  }
}

module.exports = {
  Command,
  // Blog Post Commands
  CreateBlogPostCommand,
  UpdateBlogPostCommand,
  PublishBlogPostCommand,
  UnpublishBlogPostCommand,
  DeleteBlogPostCommand,
  AddTagToBlogPostCommand,
  RemoveTagFromBlogPostCommand,
  GenerateBlogPostCommand,
  // Comment Commands
  AddCommentCommand,
  UpdateCommentCommand,
  DeleteCommentCommand,
  ModerateCommentCommand,
  // User Commands
  RegisterUserCommand,
  UpdateUserProfileCommand,
  ChangeUserPasswordCommand,
  DeactivateUserCommand,
  ActivateUserCommand,
  // Category Commands
  CreateCategoryCommand,
  UpdateCategoryCommand,
  DeleteCategoryCommand,
  // Analytics Commands
  TrackPageViewCommand,
  TrackUserEngagementCommand,
  // Newsletter Commands
  SubscribeToNewsletterCommand,
  UnsubscribeFromNewsletterCommand,
  SendNewsletterCommand
};
