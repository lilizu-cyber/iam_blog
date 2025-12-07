const { v4: uuidv4 } = require('uuid');

// Base Event class
class Event {
  constructor(type, data, metadata = {}) {
    this.eventId = uuidv4();
    this.type = type;
    this.timestamp = new Date().toISOString();
    this.data = data;
    this.metadata = metadata;
  }
}

// Blog Post Events
class BlogPostCreatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('BlogPostCreated', data, metadata);
  }
}

class BlogPostUpdatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('BlogPostUpdated', data, metadata);
  }
}

class BlogPostPublishedEvent extends Event {
  constructor(data, metadata = {}) {
    super('BlogPostPublished', data, metadata);
  }
}

class BlogPostUnpublishedEvent extends Event {
  constructor(data, metadata = {}) {
    super('BlogPostUnpublished', data, metadata);
  }
}

class BlogPostDeletedEvent extends Event {
  constructor(data, metadata = {}) {
    super('BlogPostDeleted', data, metadata);
  }
}

class TagAddedToBlogPostEvent extends Event {
  constructor(data, metadata = {}) {
    super('TagAddedToBlogPost', data, metadata);
  }
}

class TagRemovedFromBlogPostEvent extends Event {
  constructor(data, metadata = {}) {
    super('TagRemovedFromBlogPost', data, metadata);
  }
}

class BlogPostViewedEvent extends Event {
  constructor(data, metadata = {}) {
    super('BlogPostViewed', data, metadata);
  }
}

// Comment Events
class CommentAddedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CommentAdded', data, metadata);
  }
}

class CommentUpdatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CommentUpdated', data, metadata);
  }
}

class CommentDeletedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CommentDeleted', data, metadata);
  }
}

class CommentModeratedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CommentModerated', data, metadata);
  }
}

class CommentApprovedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CommentApproved', data, metadata);
  }
}

class CommentRejectedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CommentRejected', data, metadata);
  }
}

// User Events
class UserRegisteredEvent extends Event {
  constructor(data, metadata = {}) {
    super('UserRegistered', data, metadata);
  }
}

class UserProfileUpdatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('UserProfileUpdated', data, metadata);
  }
}

class UserPasswordChangedEvent extends Event {
  constructor(data, metadata = {}) {
    super('UserPasswordChanged', data, metadata);
  }
}

class UserDeactivatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('UserDeactivated', data, metadata);
  }
}

class UserActivatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('UserActivated', data, metadata);
  }
}

class UserLoggedInEvent extends Event {
  constructor(data, metadata = {}) {
    super('UserLoggedIn', data, metadata);
  }
}

class UserLoggedOutEvent extends Event {
  constructor(data, metadata = {}) {
    super('UserLoggedOut', data, metadata);
  }
}

class UserEmailVerifiedEvent extends Event {
  constructor(data, metadata = {}) {
    super('UserEmailVerified', data, metadata);
  }
}

// Category Events
class CategoryCreatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CategoryCreated', data, metadata);
  }
}

class CategoryUpdatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CategoryUpdated', data, metadata);
  }
}

class CategoryDeletedEvent extends Event {
  constructor(data, metadata = {}) {
    super('CategoryDeleted', data, metadata);
  }
}

// Analytics Events
class PageViewTrackedEvent extends Event {
  constructor(data, metadata = {}) {
    super('PageViewTracked', data, metadata);
  }
}

class UserEngagementTrackedEvent extends Event {
  constructor(data, metadata = {}) {
    super('UserEngagementTracked', data, metadata);
  }
}

class SearchPerformedEvent extends Event {
  constructor(data, metadata = {}) {
    super('SearchPerformed', data, metadata);
  }
}

// Newsletter Events
class NewsletterSubscriptionCreatedEvent extends Event {
  constructor(data, metadata = {}) {
    super('NewsletterSubscriptionCreated', data, metadata);
  }
}

class NewsletterSubscriptionCancelledEvent extends Event {
  constructor(data, metadata = {}) {
    super('NewsletterSubscriptionCancelled', data, metadata);
  }
}

class NewsletterSentEvent extends Event {
  constructor(data, metadata = {}) {
    super('NewsletterSent', data, metadata);
  }
}

// Security Events
class SecurityThreatDetectedEvent extends Event {
  constructor(data, metadata = {}) {
    super('SecurityThreatDetected', data, metadata);
  }
}

class SuspiciousActivityDetectedEvent extends Event {
  constructor(data, metadata = {}) {
    super('SuspiciousActivityDetected', data, metadata);
  }
}

class LoginAttemptFailedEvent extends Event {
  constructor(data, metadata = {}) {
    super('LoginAttemptFailed', data, metadata);
  }
}

class AccountLockedEvent extends Event {
  constructor(data, metadata = {}) {
    super('AccountLocked', data, metadata);
  }
}

class AccountUnlockedEvent extends Event {
  constructor(data, metadata = {}) {
    super('AccountUnlocked', data, metadata);
  }
}

// Content Moderation Events
class ContentFlaggedEvent extends Event {
  constructor(data, metadata = {}) {
    super('ContentFlagged', data, metadata);
  }
}

class ContentApprovedEvent extends Event {
  constructor(data, metadata = {}) {
    super('ContentApproved', data, metadata);
  }
}

class ContentRejectedEvent extends Event {
  constructor(data, metadata = {}) {
    super('ContentRejected', data, metadata);
  }
}

// System Events
class SystemMaintenanceScheduledEvent extends Event {
  constructor(data, metadata = {}) {
    super('SystemMaintenanceScheduled', data, metadata);
  }
}

class SystemBackupCompletedEvent extends Event {
  constructor(data, metadata = {}) {
    super('SystemBackupCompleted', data, metadata);
  }
}

class SystemErrorOccurredEvent extends Event {
  constructor(data, metadata = {}) {
    super('SystemErrorOccurred', data, metadata);
  }
}

module.exports = {
  Event,
  // Blog Post Events
  BlogPostCreatedEvent,
  BlogPostUpdatedEvent,
  BlogPostPublishedEvent,
  BlogPostUnpublishedEvent,
  BlogPostDeletedEvent,
  TagAddedToBlogPostEvent,
  TagRemovedFromBlogPostEvent,
  BlogPostViewedEvent,
  // Comment Events
  CommentAddedEvent,
  CommentUpdatedEvent,
  CommentDeletedEvent,
  CommentModeratedEvent,
  CommentApprovedEvent,
  CommentRejectedEvent,
  // User Events
  UserRegisteredEvent,
  UserProfileUpdatedEvent,
  UserPasswordChangedEvent,
  UserDeactivatedEvent,
  UserActivatedEvent,
  UserLoggedInEvent,
  UserLoggedOutEvent,
  UserEmailVerifiedEvent,
  // Category Events
  CategoryCreatedEvent,
  CategoryUpdatedEvent,
  CategoryDeletedEvent,
  // Analytics Events
  PageViewTrackedEvent,
  UserEngagementTrackedEvent,
  SearchPerformedEvent,
  // Newsletter Events
  NewsletterSubscriptionCreatedEvent,
  NewsletterSubscriptionCancelledEvent,
  NewsletterSentEvent,
  // Security Events
  SecurityThreatDetectedEvent,
  SuspiciousActivityDetectedEvent,
  LoginAttemptFailedEvent,
  AccountLockedEvent,
  AccountUnlockedEvent,
  // Content Moderation Events
  ContentFlaggedEvent,
  ContentApprovedEvent,
  ContentRejectedEvent,
  // System Events
  SystemMaintenanceScheduledEvent,
  SystemBackupCompletedEvent,
  SystemErrorOccurredEvent
};
