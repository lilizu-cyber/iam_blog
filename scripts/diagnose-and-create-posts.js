require('dotenv').config();

// Force output
process.stdout.write('Starting diagnostic...\n');

const { initializeSequelize } = require('../src/backend/models/index');
const PostgresEventStore = require('../src/backend/infrastructure/PostgresEventStore');
const { EventBus } = require('../src/backend/infrastructure/EventBus');
const { CommandBus } = require('../src/backend/infrastructure/CommandBus');
const ReadModelStore = require('../src/backend/infrastructure/ReadModelStore');
const BlogPostCommandHandlers = require('../src/backend/application/commandHandlers/BlogPostCommandHandlers');
const BlogPostProjection = require('../src/backend/readModels/projections/BlogPostProjection');

const posts = [
  {
    title: "Identity as the New Security Perimeter: How Okta Shapes Modern IAM Strategy",
    content: `For decades, security strategies revolved around protecting the network perimeter. Firewalls, VPN tunnels, and tightly controlled internal networks were considered the backbone of defense. But the rise of cloud computing, SaaS adoption, mobile workforces, and remote collaboration has shattered the traditional perimeter. Today, users, applications, and data reside everywhere—and identity has emerged as the new foundation of digital security.

Identity and Access Management (IAM) is no longer a supporting operational function; it has become a core pillar of cybersecurity. Among the leading IAM platforms shaping this shift is Okta, which provides a unified system for authentication, authorization, lifecycle automation, and adaptive security controls.

One of the biggest drivers behind identity-focused security is the concept of Zero Trust. Instead of assuming internal traffic is safe, Zero Trust treats every access attempt as potentially malicious, requiring verification at every step. Okta plays a central role in enabling Zero Trust by providing secure identity verification across users, devices, and applications—whether they are on-premises or in the cloud.

Single Sign-On (SSO) is often the first step organizations take toward centralized identity. Instead of juggling dozens of credentials, users authenticate once through Okta, and access is granted based on policies and entitlements. This reduces the attack surface dramatically, as compromised passwords remain a primary vector in security breaches. With Okta SSO, companies strengthen their defenses while improving the user experience.

Beyond authentication, Adaptive Multi-Factor Authentication (MFA) elevates security further. Traditional MFA treats all authentication attempts equally, but Okta evaluates contextual signals—location, device, IP reputation, user behavior, and risk level—to determine the appropriate level of verification. It's security that adjusts to real-world conditions, striking the balance between protection and usability.

Another area where Okta excels is Lifecycle Management. When employees join, change roles, or leave, access must be granted and revoked with precision. Manual processes introduce delays, errors, and compliance risks. Okta automates these transitions by synchronizing with HR systems and provisioning applications instantly. Offboarding becomes near-instant, sealing potential vulnerabilities before they're exploited.

As digital ecosystems expand, organizations often face fragmented identity systems. Okta brings these disparate environments together, enabling centralized policies, auditing, reporting, and compliance. Whether a company uses AWS, Azure, Google Cloud, or multiple SaaS tools, identity remains consistent and controlled through a single platform.

The shift from perimeter-based security to identity-centric security is not a trend—it's the new standard. Okta's holistic approach empowers organizations to manage this transition effectively, reducing risk while enabling flexibility and innovation. As remote work, cloud adoption, and automation continue to grow, identity will remain at the core of enterprise security, and platforms like Okta will be essential for shaping secure digital futures.`,
    excerpt: "Identity has emerged as the new foundation of digital security. Discover how Okta shapes modern IAM strategy with Zero Trust, SSO, adaptive MFA, and lifecycle management.",
    tags: ["IAM", "Okta", "Zero Trust", "SSO", "Identity Security"],
    categoryId: "iam"
  },
  {
    title: "Automating the Identity Lifecycle With Okta: Reducing Risk and Improving Efficiency",
    content: `Identity Lifecycle Management (LCM) represents one of the most transformative areas within IAM. Traditionally, granting and revoking access involved a combination of spreadsheets, emails, ticketing systems, and manual intervention across HR, IT, and security teams. This led to delays, over-provisioning, and situations where former employees retained access far longer than they should.

Okta's Lifecycle Management (LCM) solves these challenges by automating the flow of identity data and access rights across an organization's entire application ecosystem. The moment a new employee is hired, a job change occurs, or a termination is processed, Okta ensures that identity attributes, group memberships, and entitlements are instantly updated.

The onboarding process is often the first major improvement organizations notice when implementing Okta LCM. Instead of waiting days for access, new hires receive the correct permissions within minutes based on role, department, and attributes synced from HR systems such as Workday, SAP SuccessFactors, or Oracle HCM. This results in increased productivity, reduced IT workload, and a consistent onboarding experience across the company.

Equally important is offboarding, which historically presents one of the highest security risks. When access is removed manually, there's always a chance that an application or privilege gets overlooked. With Okta, disabling a user in the source of truth (HRIS or Active Directory) immediately cascades deactivation through all connected systems—from email and file storage to project management tools and cloud applications. This eliminates orphaned accounts and significantly reduces insider threat risks.

Another powerful capability comes from Okta Workflows, a no-code automation framework that extends lifecycle processes even further. Workflows can trigger tasks such as notifying managers, generating access reports, sending welcome messages, or disabling tokens and API keys. For organizations with complex identity ecosystems, Workflows brings tailored logic without requiring custom development.

Compliance and audit readiness also improve drastically when lifecycle processes are automated. Access changes are logged, timestamps are recorded, and provisioning is standardized—making it far easier to demonstrate adherence to security policies and regulatory requirements.

As organizations embrace hybrid or multi-cloud environments, the ability to handle lifecycle changes dynamically becomes indispensable. Okta's scalable and flexible architecture ensures identity remains synchronized, accurate, and secure across every platform.

Identity lifecycle automation is not just a convenience—it is essential for security, efficiency, and compliance. With Okta LCM, businesses can modernize their identity operations and strengthen their cybersecurity posture simultaneously.`,
    excerpt: "Learn how Okta's Lifecycle Management automates identity provisioning and deprovisioning, reducing security risks and improving operational efficiency across your organization.",
    tags: ["IAM", "Okta", "Lifecycle Management", "Automation", "Identity Governance"],
    categoryId: "iam"
  },
  {
    title: "Defending Against MFA Fatigue Attacks: How Okta Strengthens Modern Authentication",
    content: `Multi-Factor Authentication (MFA) is widely recognized as one of the most effective defenses against compromised credentials. However, attackers have adapted. One of the fastest-growing threats is MFA fatigue, where attackers bombard a user with endless push notification requests. The goal is simple: overwhelm the victim into approving one of them—either accidentally or out of frustration.

MFA fatigue attacks have been behind several recent high-profile breaches, making it essential for organizations to adopt authentication methods that minimize or eliminate this risk. Okta offers several layers of protection that help organizations defend against such attacks.

The first and most impactful defense is Okta's support for phishing-resistant authentication, including WebAuthn, FIDO2, and Okta FastPass. These methods do not rely on push notifications, SMS messages, or one-time codes. Instead, they use device-bound credentials and cryptographic authentication. Even if an attacker knows a user's password, they cannot initiate a push or trick the user into approving anything.

Another crucial capability is Adaptive MFA. Instead of treating every authentication request equally, Okta evaluates contextual factors such as IP address, device reputation, geographic anomalies, and historical user behavior. A login attempt from a suspicious location or unfamiliar browser may trigger a higher level of verification—or be blocked entirely.

Organizations can also configure push restrictions, limiting the number of MFA requests a user can receive in a short time. Repeated failures can trigger alerts or automatically lock out access attempts. Through Okta Workflows, custom actions can be taken when risky patterns appear—for example, notifying the security operations team or creating an incident ticket.

Beyond technical controls, user awareness plays an important role. Okta's clear, contextual MFA prompts help users understand what they are approving. Security teams can integrate training into onboarding, emphasizing that unexpected push notifications should never be approved.

As authentication threats evolve, relying solely on traditional MFA is no longer enough. By embracing phishing-resistant methods, adaptive intelligence, and automated risk responses, Okta provides a robust defense against MFA fatigue and similar modern attack techniques.`,
    excerpt: "MFA fatigue attacks are on the rise. Discover how Okta's phishing-resistant authentication, adaptive MFA, and intelligent risk controls protect against these modern threats.",
    tags: ["IAM", "Okta", "MFA", "Authentication", "Security", "Zero Trust"],
    categoryId: "iam"
  },
  {
    title: "How Okta Workflows and AI Transform Identity Operations",
    content: `Identity operations teams often struggle with repetitive, error-prone tasks: resetting passwords, updating entitlements, performing access reviews, and coordinating role changes across multiple systems. These tasks may seem routine, but at scale they consume significant time and introduce risks when inconsistencies arise.

Okta Workflows, combined with emerging AI capabilities, is reshaping how organizations handle identity operations. Workflows delivers no-code automation, empowering IAM teams to automate processes without relying on complex scripting or custom development. By integrating AI-driven insights, organizations can move toward predictive, intelligent identity management.

One of the most common use cases is automated provisioning. When HR updates a record indicating a job change, Workflows can adjust group memberships, reassign licenses, and notify relevant teams. AI can augment this by analyzing historical access patterns to suggest the appropriate entitlements for new roles—or flag anomalies that deviate from established norms.

Another emerging area is AI-assisted policy creation. Writing compliant, consistent access policies is challenging even for experienced administrators. AI tools can analyze application requirements, user behaviors, and industry best practices to generate draft policies that IAM teams can refine. This dramatically accelerates policy development while reducing human error.

In complex environments, identity-related incidents often stem from misconfigurations or improper entitlements. AI can help detect outliers—such as users with unnecessary administrative permissions or accounts with unusual login behavior. Workflows can respond automatically by alerting teams, adjusting access, or triggering an access review.

Access reviews, one of the most time-consuming governance activities, also benefit from automation and AI. Instead of presenting reviewers with overwhelming lists, AI can highlight the riskiest entitlements or recommend revocations based on behavioral indicators. Workflows then handles the mechanics of removing access, updating records, and maintaining audit trails.

Perhaps the most transformative impact is in reducing operational overhead. Tasks that previously required coordination across HR, IT, and security teams can be executed automatically. IAM teams can shift focus from operational firefighting to strategic improvements, architecture, and governance.

Okta Workflows and AI represent the future of identity operations: intelligent, automated, and adaptive. Organizations implementing these capabilities gain efficiency, accuracy, and stronger security posture.`,
    excerpt: "Discover how Okta Workflows and AI are revolutionizing identity operations, automating repetitive tasks, and enabling intelligent, predictive identity management.",
    tags: ["IAM", "Okta", "Workflows", "AI", "Automation", "Identity Operations"],
    categoryId: "iam"
  },
  {
    title: "Rethinking Access Governance With Okta Identity Governance (OIG)",
    content: `Access governance traditionally evokes images of spreadsheets, email reminders, and exhaustion. For many organizations, access reviews and certifications remain manual processes with limited context, poor visibility, and high administrative burden. This not only frustrates teams but also introduces significant compliance risks.

Okta Identity Governance (OIG) modernizes governance by integrating it directly into the identity lifecycle, connecting access certifications, provisioning, policy enforcement, and automated remediation in a single platform.

The cornerstone of OIG is its simplified access review process. Instead of managers reviewing endless lists of entitlements, OIG presents contextual, easy-to-understand information: who the user is, what their role requires, when access was granted, and whether unusual activity has occurred. This makes reviews faster, more accurate, and less prone to rubber-stamping.

The integration with Okta Lifecycle Management ensures that reviewers can revoke access instantly. Decisions made during review campaigns propagate across all integrated applications, eliminating the delays that often undermine governance efforts.

AI enhances OIG by identifying anomalies such as entitlement creep, dormant accounts, or users with unusually high privilege levels. By prioritizing high-risk items, AI helps reviewers focus where it matters most, improving both security and compliance outcomes.

Another major advantage of OIG is the ability to automate periodic review campaigns. Organizations subject to regulatory frameworks—such as SOX, GDPR, HIPAA, or ISO 27001—can schedule recurring access reviews, ensuring compliance without last-minute panic. Audit trails are automatically generated, simplifying reporting during audits.

OIG also improves collaboration between business and IT. Instead of relying on technical administrators to interpret complex entitlement names, OIG enables clearer categorization, descriptions, and risk scores. Business stakeholders can therefore make informed decisions without needing deep system knowledge.

The shift toward modern identity governance reflects a broader industry trend: security and compliance must be continuous, automated, and data-driven. OIG embodies this shift by unifying lifecycle processes, adaptive security, and intelligent review mechanisms.

Organizations deploying OIG benefit from stronger governance, reduced audit burden, and more effective risk management—ultimately transforming access governance from a painful obligation into a streamlined, strategic capability.`,
    excerpt: "Transform access governance from a manual burden into a streamlined, automated process with Okta Identity Governance. Learn how OIG simplifies reviews and improves compliance.",
    tags: ["IAM", "Okta", "Identity Governance", "Access Reviews", "Compliance", "OIG"],
    categoryId: "iam"
  }
];

async function main() {
  let eventStore = null;
  let readModelStore = null;
  
  try {
    process.stdout.write('=== IAM Posts Diagnostic & Creation ===\n\n');
    
    const postgresUri = process.env.POSTGRESQL_URI || process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/iam_blog_db';
    
    // Check existing posts
    process.stdout.write('Step 1: Checking existing posts...\n');
    const sequelize = initializeSequelize(postgresUri);
    await sequelize.authenticate();
    
    const [existingPosts] = await sequelize.query(`
      SELECT post_id, title, status, category_id, is_iam_related 
      FROM blog_posts 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    process.stdout.write(`Found ${existingPosts.length} existing posts\n`);
    if (existingPosts.length > 0) {
      process.stdout.write('\nExisting posts:\n');
      existingPosts.forEach((p, i) => {
        process.stdout.write(`${i + 1}. ${p.title.substring(0, 50)}... [${p.status}] IAM: ${p.is_iam_related}\n`);
      });
    }
    
    const [iamCount] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM blog_posts 
      WHERE status = 'published' AND is_iam_related = true
    `);
    
    process.stdout.write(`\nPublished IAM posts: ${iamCount[0].count}\n\n`);
    
    if (iamCount[0].count >= 5) {
      process.stdout.write('✓ All 5 IAM posts already exist!\n');
      await sequelize.close();
      process.exit(0);
    }
    
    // Initialize infrastructure
    process.stdout.write('Step 2: Initializing infrastructure...\n');
    eventStore = new PostgresEventStore(postgresUri);
    await eventStore.connect();
    process.stdout.write('✓ Event store connected\n');
    
    readModelStore = new ReadModelStore(postgresUri);
    await readModelStore.connect();
    process.stdout.write('✓ Read model store connected\n');
    
    const eventBus = new EventBus();
    const commandBus = new CommandBus();
    const commandHandlers = new BlogPostCommandHandlers(eventStore, eventBus);
    
    // Set up projections
    const blogPostProjection = new BlogPostProjection(readModelStore);
    eventBus.registerProjection('BlogPostProjection', [
      'BlogPostCreated', 'BlogPostUpdated', 'BlogPostPublished', 
      'BlogPostUnpublished', 'BlogPostDeleted'
    ], async (event) => {
      try {
        if (event.type === 'BlogPostCreated') await blogPostProjection.onBlogPostCreated(event);
        else if (event.type === 'BlogPostUpdated') await blogPostProjection.onBlogPostUpdated(event);
        else if (event.type === 'BlogPostPublished') await blogPostProjection.onBlogPostPublished(event);
        else if (event.type === 'BlogPostUnpublished') await blogPostProjection.onBlogPostUnpublished(event);
        else if (event.type === 'BlogPostDeleted') await blogPostProjection.onBlogPostDeleted(event);
      } catch (err) {
        process.stderr.write(`Projection error: ${err.message}\n`);
      }
    });
    
    commandBus.registerHandler('CreateBlogPost', 
      commandHandlers.handleCreateBlogPost.bind(commandHandlers));
    commandBus.registerHandler('PublishBlogPost', 
      commandHandlers.handlePublishBlogPost.bind(commandHandlers));
    
    process.stdout.write('✓ Handlers registered\n\n');
    
    // Create posts
    const authorId = 'admin-001';
    const authorName = 'Admin';
    const authorEmail = 'admin@cybersec-iam.com';
    
    for (let i = 0; i < posts.length; i++) {
      const postData = posts[i];
      const slug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      process.stdout.write(`Step ${i + 3}: Creating post ${i + 1}/${posts.length}\n`);
      process.stdout.write(`Title: ${postData.title.substring(0, 60)}...\n`);
      
      try {
        const createCommand = {
          type: 'CreateBlogPost',
          data: {
            ...postData,
            slug,
            authorId,
            authorName,
            authorEmail,
            status: 'draft'
          },
          metadata: {
            userId: authorId,
            timestamp: new Date().toISOString(),
            source: 'script'
          }
        };
        
        const createResult = await commandBus.execute(createCommand);
        const postId = createResult.postId;
        process.stdout.write(`✓ Created (ID: ${postId})\n`);
        
        // Wait for projection
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const publishCommand = {
          type: 'PublishBlogPost',
          data: { postId },
          metadata: {
            userId: authorId,
            timestamp: new Date().toISOString(),
            source: 'script'
          }
        };
        
        await commandBus.execute(publishCommand);
        process.stdout.write(`✓ Published\n\n`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        process.stderr.write(`✗ Error: ${err.message}\n`);
        if (err.stack) process.stderr.write(err.stack + '\n');
      }
    }
    
    // Wait for all projections
    process.stdout.write('Waiting for projections to complete...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify
    const [finalCount] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM blog_posts 
      WHERE status = 'published' AND is_iam_related = true
    `);
    
    process.stdout.write(`\n✓ Published IAM posts: ${finalCount[0].count}\n`);
    process.stdout.write('\n=== Complete! Check http://localhost:3000/iam ===\n');
    
    if (eventStore) await eventStore.disconnect();
    if (readModelStore) await readModelStore.disconnect();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    process.stderr.write(`\n✗ Fatal error: ${error.message}\n`);
    if (error.stack) process.stderr.write(error.stack + '\n');
    if (eventStore) await eventStore.disconnect();
    if (readModelStore) await readModelStore.disconnect();
    process.exit(1);
  }
}

main();







