import { Helmet } from 'react-helmet-async'
import { siteConfig } from '../config/site'

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - CyberSec & IAM Blog</title>
        <meta name="description" content="Privacy Policy for CyberSec & IAM Blog" />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg dark:prose-dark max-w-none text-left">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This Privacy Policy describes how {siteConfig.siteName}, operated by{' '}
                {siteConfig.authorName}, collects, uses, and protects your personal information
                when you visit our blog and use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Information We Collect
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may collect the following types of information:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">Contact information (name, email address) when you subscribe to our newsletter or contact us</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Usage data and analytics to improve our website</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Third-Party Services and Advertising
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use Google AdSense to serve advertisements on our website. Google AdSense is a third-party advertising service 
                provided by Google LLC that uses cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">Display personalized advertisements based on your interests and browsing behavior</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Measure the effectiveness of advertisements</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Collect information about your interactions with ads and websites</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Google AdSense may collect information such as your IP address, browser type, device information, and browsing patterns. 
                This information is used to show you relevant ads and to help advertisers understand the effectiveness of their campaigns.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site 
                and/or other sites on the Internet. You may opt out of personalized advertising by visiting{' '}
                <a 
                  href="https://www.google.com/settings/ads" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Google's Ads Settings
                </a>
                {' '}or{' '}
                <a 
                  href="https://www.aboutads.info/choices/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  www.aboutads.info
                </a>.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For more information about how Google uses data when you use our site, please visit{' '}
                <a 
                  href="https://policies.google.com/technologies/partner-sites" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Google's Privacy & Terms
                </a>.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Important:</strong> Google AdSense will only be loaded after you have provided your consent through our 
                cookie consent banner. You can withdraw your consent at any time by managing your cookie preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">Send you newsletters and updates</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Respond to your inquiries</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Improve our website and services</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Analyze website usage and trends</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Data Protection
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate security measures to protect your personal information. However, 
                no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Your Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">Access your personal data</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Request correction of inaccurate data</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Request deletion of your data</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Unsubscribe from our newsletter at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about this Privacy Policy, please contact us through our contact form.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}


















